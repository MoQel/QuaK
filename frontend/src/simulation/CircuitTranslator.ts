import {
    CircuitResponse,
    MeasurementDto,
    getCircuitWidth,
    isQuantumRegister,
} from '@/api/dto/circuit.ts';
import * as qulacs from 'qulacs-wasm';
import { Complex } from 'qulacs-wasm';
import {
    CircuitContext,
    createCircuitContext,
    resolveClassicSelector,
    resolveQuantumSelector,
    validateOperations,
} from '@/simulation/circuitContext.ts';
import { applyGateToState } from '@/simulation/qulacsGates.ts';
import {
    Bit,
    buildOutcomes,
    buildReadoutRegisters,
    classicalBitsToBitString,
    getClassicBitWidth,
    validateOutcomeIntegrity,
} from '@/simulation/readout.ts';
import { throwSimulationError } from '@/simulation/simulation.errors.ts';
import {
    Disposable,
    MeasurementMode,
    MeasurementResult,
    SimulationError,
    SimulationMode,
    SimulationOptions,
    SimulationResult,
    StateVectorEntry,
} from '@/simulation/simulation.types.ts';

interface MeasurementAccumulator {
    operationId?: string;
    targetQubit: MeasurementResult['targetQubit'];
    classicBit?: MeasurementResult['classicBit'];
    probabilityZeroTotal: number;
    probabilityOneTotal: number;
    zeroCount: number;
    oneCount: number;
}

export class CircuitTranslator {
    private static readonly SAMPLE_COUNT = 1024;
    private static readonly MIN_SAMPLE_COUNT = 1;
    private static readonly MAX_SAMPLE_COUNT = 100000;
    private static readonly MAX_CIRCUIT_WIDTH = 12;
    private static readonly DEFAULT_MODE: SimulationMode = 'exact';
    private static readonly DEFAULT_MEASUREMENT_MODE: MeasurementMode = 'measurement-gates';

    static translateAndRun(circuitData: CircuitResponse, options: SimulationOptions = {}): SimulationResult {
        const sampleCount = this.validateSampleCount(options.sampleCount ?? this.SAMPLE_COUNT);
        const mode = options.mode ?? this.DEFAULT_MODE;
        const measurementMode = options.measurementMode ?? this.DEFAULT_MEASUREMENT_MODE;
        const circuitWidth = getCircuitWidth(circuitData);

        if (circuitWidth === 0) return this.createEmptyResult(circuitWidth);
        if (circuitWidth > (options.maxCircuitWidth ?? this.MAX_CIRCUIT_WIDTH)) {
            throwSimulationError({
                code: 'QUBIT_LIMIT_EXCEEDED',
                message: `Circuit exceeds maximum limit of ${options.maxCircuitWidth ?? this.MAX_CIRCUIT_WIDTH} qubits.`,
            });
        }

        const context = createCircuitContext(circuitData);
        validateOperations(circuitData, context);

        if (mode === 'simulation') {
            if (!this.hasExplicitMeasurements(circuitData) && measurementMode === 'measurement-gates') {
                return this.runStateSamplingSimulation(circuitData, circuitWidth, context, sampleCount);
            }

            return this.runShotSimulation(circuitData, circuitWidth, context, sampleCount, measurementMode);
        }

        return this.runExactSimulation(circuitData, circuitWidth, context, sampleCount, measurementMode);
    }

    private static runExactSimulation(
        circuitData: CircuitResponse,
        circuitWidth: number,
        context: CircuitContext,
        sampleCount: number,
        measurementMode: MeasurementMode,
    ): SimulationResult {
        const state = new qulacs.QuantumState(circuitWidth);
        const classicWidth = getClassicBitWidth(circuitData);
        const finalReadoutOffset = classicWidth;
        const classicalMemoryWidth =
            classicWidth + (measurementMode === 'measurement-gates-plus-final' ? circuitWidth : 0);

        try {
            state.set_zero_state();
            this.initializeClassicalMemory(state, Math.max(classicalMemoryWidth, 1));

            const measurementResults = this.executeCircuit(circuitData, state, context, sampleCount);
            const stateVectorBeforeFinalMeasurements =
                measurementMode === 'measurement-gates-plus-final'
                    ? this.extractStateVector(state, circuitWidth)
                    : null;

            if (measurementMode === 'measurement-gates-plus-final') {
                measurementResults.push(
                    ...this.measureRemainingQubits(state, circuitData, context, finalReadoutOffset, sampleCount),
                );
            }

            return {
                status: 'COMPLETED',
                stateVector: stateVectorBeforeFinalMeasurements ?? this.extractStateVector(state, circuitWidth),
                counts: null,
                measurementResults,
                measurementMappings: context.measurementMappings,
                simulatedQubits: circuitWidth,
            };
        } finally {
            (state as unknown as Disposable).delete();
        }
    }

    private static runStateSamplingSimulation(
        circuitData: CircuitResponse,
        circuitWidth: number,
        context: CircuitContext,
        sampleCount: number,
    ): SimulationResult {
        const state = new qulacs.QuantumState(circuitWidth);

        try {
            state.set_zero_state();
            this.initializeClassicalMemory(state, 1);
            this.executeCircuit(circuitData, state, context, sampleCount);

            const counts = this.aggregateSamples(state.sampling(sampleCount) as unknown as number[], circuitWidth);

            return {
                status: 'COMPLETED',
                stateVector: [],
                counts,
                measurementResults: [],
                measurementMappings: context.measurementMappings,
                simulatedQubits: circuitWidth,
                shots: sampleCount,
                distinctOutcomeCount: Object.keys(counts).length,
            };
        } finally {
            (state as unknown as Disposable).delete();
        }
    }

    private static runShotSimulation(
        circuitData: CircuitResponse,
        circuitWidth: number,
        context: CircuitContext,
        sampleCount: number,
        measurementMode: MeasurementMode,
    ): SimulationResult {
        const counts: Record<string, number> = {};
        const measurementAccumulators = new Map<string, MeasurementAccumulator>();
        const classicWidth = getClassicBitWidth(circuitData);
        const includeAutoReadout =
            measurementMode === 'measurement-gates-plus-final' && this.hasUnmeasuredQubits(circuitData);
        const autoReadoutOffset = classicWidth;
        const resultBitWidth = classicWidth + (includeAutoReadout ? circuitWidth : 0);
        const readoutRegisters = buildReadoutRegisters(
            circuitData,
            circuitWidth,
            context.classicOffsets,
            includeAutoReadout,
            autoReadoutOffset,
        );

        for (let shot = 0; shot < sampleCount; shot++) {
            const state = new qulacs.QuantumState(circuitWidth);

            try {
                state.set_zero_state();
                this.initializeClassicalMemory(state, Math.max(resultBitWidth, 1));

                for (const measurementResult of this.executeCircuit(circuitData, state, context, 1)) {
                    this.recordMeasurement(measurementAccumulators, measurementResult);
                }

                if (includeAutoReadout) {
                    for (const measurementResult of this.measureRemainingQubits(
                        state,
                        circuitData,
                        context,
                        autoReadoutOffset,
                        1,
                    )) {
                        this.recordMeasurement(measurementAccumulators, measurementResult);
                    }
                }

                const classicalBits = this.readClassicalMemory(state, resultBitWidth);
                const shotKey = classicalBitsToBitString(classicalBits, readoutRegisters);
                counts[shotKey] = (counts[shotKey] || 0) + 1;
            } finally {
                (state as unknown as Disposable).delete();
            }
        }

        const outcomes = buildOutcomes(counts, readoutRegisters, sampleCount);
        validateOutcomeIntegrity(outcomes, sampleCount);

        return {
            status: 'COMPLETED',
            stateVector: [],
            counts,
            measurementResults: this.buildMeasurementResults(measurementAccumulators, sampleCount),
            simulatedQubits: resultBitWidth,
            readoutRegisters: readoutRegisters.map(({ registerId, name, size }) => ({ registerId, name, size })),
            outcomes,
            measurementMappings: context.measurementMappings,
            shots: sampleCount,
            measuredShotCount: sampleCount,
            distinctOutcomeCount: outcomes.length,
        };
    }

    private static executeCircuit(
        circuitData: CircuitResponse,
        state: qulacs.QuantumState,
        context: CircuitContext,
        sampleCount: number,
    ): MeasurementResult[] {
        const measurementResults: MeasurementResult[] = [];

        for (const layer of circuitData.layers) {
            for (const op of layer.quantumOperations) {
                if (op.type === 'ELEMENTARY_QUANTUM_GATE') {
                    applyGateToState(state, op, context.quantumOffsets);
                } else if (op.type === 'MEASUREMENT') {
                    measurementResults.push(...this.applyMeasurement(state, op, context, sampleCount));
                }
            }
        }

        return measurementResults;
    }

    private static applyMeasurement(
        state: qulacs.QuantumState,
        measurement: MeasurementDto,
        context: CircuitContext,
        sampleCount: number,
    ): MeasurementResult[] {
        return measurement.targetQubits.map((targetQubit, index) => {
            const classicBit = measurement.classicBits[index];
            const targetIndex = resolveQuantumSelector(targetQubit, context, measurement.id);
            const classicalAddress = resolveClassicSelector(classicBit, context, measurement.id);
            const { outcome, probabilities } = this.measureQubit(state, targetIndex, classicalAddress, {
                code: 'RESULT_INTEGRITY_ERROR',
                message: `Measurement wrote an invalid value to classical bit '${classicBit.registerId}[${classicBit.index}]'.`,
                operationId: measurement.id,
                registerId: classicBit.registerId,
                bitIndex: classicBit.index,
            });

            return {
                operationId: measurement.id,
                targetQubit,
                classicBit,
                outcome,
                probabilities,
                counts: this.countMeasurementSamples(outcome, sampleCount),
            };
        });
    }

    private static measureRemainingQubits(
        state: qulacs.QuantumState,
        circuitData: CircuitResponse,
        context: CircuitContext,
        autoReadoutOffset: number,
        sampleCount: number,
    ): MeasurementResult[] {
        const measuredQubits = this.getExplicitlyMeasuredQubits(circuitData);
        const measurementResults: MeasurementResult[] = [];

        for (const register of circuitData.registers) {
            if (!isQuantumRegister(register)) continue;

            for (let index = 0; index < register.numberOfQubits; index++) {
                const key = `${register.id}:${index}`;
                if (measuredQubits.has(key)) continue;

                const targetQubit = { registerId: register.id, index };
                const targetIndex = context.quantumOffsets[register.id] + index;
                const classicalAddress = autoReadoutOffset + targetIndex;
                const { outcome, probabilities } = this.measureQubit(state, targetIndex, classicalAddress, {
                    code: 'RESULT_INTEGRITY_ERROR',
                    message: `Automatic readout wrote an invalid value to address ${classicalAddress}.`,
                    registerId: '__auto__',
                    bitIndex: targetIndex,
                });

                measurementResults.push({
                    operationId: `auto-measure-${register.id}-${index}`,
                    targetQubit,
                    classicBit: { registerId: '__auto__', index: targetIndex },
                    outcome,
                    probabilities,
                    counts: this.countMeasurementSamples(outcome, sampleCount),
                });
            }
        }

        return measurementResults;
    }

    private static measureQubit(
        state: qulacs.QuantumState,
        targetIndex: number,
        classicalAddress: number,
        error: SimulationError,
    ) {
        const probabilities = this.getSingleQubitProbabilities(state, targetIndex);
        const measurementGate = qulacs.Measurement(targetIndex, classicalAddress);

        try {
            measurementGate.update_quantum_state(state);
        } finally {
            (measurementGate as unknown as Disposable).delete();
        }

        return {
            outcome: this.readClassicalBit(state, classicalAddress, error),
            probabilities,
        };
    }

    private static recordMeasurement(
        measurementAccumulators: Map<string, MeasurementAccumulator>,
        measurementResult: MeasurementResult,
    ): void {
        const key =
            measurementResult.operationId ??
            `${measurementResult.targetQubit.registerId}:${measurementResult.targetQubit.index}:${
                measurementResult.classicBit?.registerId ?? '__none__'
            }:${measurementResult.classicBit?.index ?? -1}`;

        const accumulator = measurementAccumulators.get(key) ?? {
            operationId: measurementResult.operationId,
            targetQubit: measurementResult.targetQubit,
            classicBit: measurementResult.classicBit,
            probabilityZeroTotal: 0,
            probabilityOneTotal: 0,
            zeroCount: 0,
            oneCount: 0,
        };

        accumulator.probabilityZeroTotal += measurementResult.probabilities.zero;
        accumulator.probabilityOneTotal += measurementResult.probabilities.one;
        if (measurementResult.outcome === 1) {
            accumulator.oneCount += 1;
        } else {
            accumulator.zeroCount += 1;
        }

        measurementAccumulators.set(key, accumulator);
    }

    private static buildMeasurementResults(
        measurementAccumulators: Map<string, MeasurementAccumulator>,
        sampleCount: number,
    ): MeasurementResult[] {
        return Array.from(measurementAccumulators.values()).map((accumulator) => ({
            operationId: accumulator.operationId,
            targetQubit: accumulator.targetQubit,
            classicBit: accumulator.classicBit,
            outcome: accumulator.oneCount >= accumulator.zeroCount ? 1 : 0,
            probabilities: {
                zero: accumulator.probabilityZeroTotal / sampleCount,
                one: accumulator.probabilityOneTotal / sampleCount,
            },
            counts: {
                zero: accumulator.zeroCount,
                one: accumulator.oneCount,
            },
        }));
    }

    private static getSingleQubitProbabilities(
        state: qulacs.QuantumState,
        targetIndex: number,
    ): MeasurementResult['probabilities'] {
        const vec = state.get_vector() as unknown as Complex[];
        let zero = 0;
        let one = 0;

        for (let basisIndex = 0; basisIndex < vec.length; basisIndex++) {
            const { real, imag } = vec[basisIndex];
            const probability = real * real + imag * imag;

            if (this.getBit(basisIndex, targetIndex) === 1) {
                one += probability;
            } else {
                zero += probability;
            }
        }

        return { zero, one };
    }

    private static initializeClassicalMemory(state: qulacs.QuantumState, bitWidth: number): void {
        for (let index = 0; index < bitWidth; index++) {
            state.set_classical_value(index, 0);
        }
    }

    private static readClassicalMemory(state: qulacs.QuantumState, bitWidth: number): Bit[] {
        return Array.from({ length: bitWidth }, (_, index) =>
            this.readClassicalBit(state, index, {
                code: 'RESULT_INTEGRITY_ERROR',
                message: `Classical address ${index} contains an invalid value.`,
                bitIndex: index,
            }),
        );
    }

    private static readClassicalBit(state: qulacs.QuantumState, address: number, error: SimulationError): Bit {
        const value = state.get_classical_value(address);
        if (value === 0 || value === 1) return value;

        throwSimulationError({
            ...error,
            details: {
                ...error.details,
                address,
                value,
            },
        });
    }

    private static countMeasurementSamples(outcome: Bit, sampleCount: number): MeasurementResult['counts'] {
        return outcome === 1 ? { zero: 0, one: sampleCount } : { zero: sampleCount, one: 0 };
    }

    private static hasExplicitMeasurements(circuitData: CircuitResponse): boolean {
        return circuitData.layers.some((layer) =>
            layer.quantumOperations.some((operation) => operation.type === 'MEASUREMENT'),
        );
    }

    private static getExplicitlyMeasuredQubits(circuitData: CircuitResponse): Set<string> {
        return new Set(
            circuitData.layers.flatMap((layer) =>
                layer.quantumOperations.flatMap((op) =>
                    op.type === 'MEASUREMENT'
                        ? op.targetQubits.map((target) => `${target.registerId}:${target.index}`)
                        : [],
                ),
            ),
        );
    }

    private static hasUnmeasuredQubits(circuitData: CircuitResponse): boolean {
        const measuredQubits = this.getExplicitlyMeasuredQubits(circuitData);

        return circuitData.registers.some(
            (register) =>
                isQuantumRegister(register) &&
                Array.from({ length: register.numberOfQubits }, (_, index) => `${register.id}:${index}`).some(
                    (key) => !measuredQubits.has(key),
                ),
        );
    }

    private static validateSampleCount(sampleCount: number): number {
        if (
            !Number.isInteger(sampleCount) ||
            Number.isNaN(sampleCount) ||
            sampleCount < this.MIN_SAMPLE_COUNT ||
            sampleCount > this.MAX_SAMPLE_COUNT
        ) {
            throwSimulationError({
                code: 'INVALID_SHOT_COUNT',
                message: `Shots must be an integer between ${this.MIN_SAMPLE_COUNT} and ${this.MAX_SAMPLE_COUNT}.`,
                details: { sampleCount },
            });
        }

        return sampleCount;
    }

    private static getBit(value: number, bitIndex: number): Bit {
        return ((value >> bitIndex) & 1) === 1 ? 1 : 0;
    }

    private static aggregateSamples(samples: number[], numQubits: number): Record<string, number> {
        const counts: Record<string, number> = {};

        for (const sample of samples) {
            const bitString = sample.toString(2).padStart(numQubits, '0');
            counts[bitString] = (counts[bitString] ?? 0) + 1;
        }

        return counts;
    }

    private static extractStateVector(state: qulacs.QuantumState, numQubits: number): StateVectorEntry[] {
        const vec = state.get_vector() as unknown as Complex[];

        return vec.map((complex, i) => {
            const { real, imag } = complex;
            const prob = real * real + imag * imag;
            const binaryString = i.toString(2).padStart(numQubits, '0');

            return {
                state: `|${binaryString}>`,
                real,
                imag,
                prob,
                phase: real === 0 && imag === 0 ? 0 : Math.atan2(imag, real),
            };
        });
    }

    private static createEmptyResult(numQubits: number): SimulationResult {
        return {
            status: 'COMPLETED',
            stateVector: [],
            counts: null,
            measurementResults: [],
            measurementMappings: [],
            simulatedQubits: numQubits,
        };
    }

}
