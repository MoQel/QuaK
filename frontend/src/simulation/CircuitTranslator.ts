import {
    CircuitResponse,
    ElementaryQuantumGateDto,
    MeasurementDto,
    getCircuitWidth,
    isQuantumRegister,
    RegisterResponse,
} from '@/api/dto/circuit.ts';
import * as qulacs from 'qulacs-wasm';
import { Complex } from 'qulacs-wasm';
import {
    Disposable,
    SimulationMode,
    SimulationOptions,
    SimulationResult,
    MeasurementResult,
    StateVectorEntry,
} from '@/simulation/simulation.types.ts';

type RegisterOffsets = Record<string, number>;

export class CircuitTranslator {
    // Default values, if options not set
    private static readonly SAMPLE_COUNT = 1024;
    private static readonly MAX_CIRCUIT_WIDTH = 12;
    private static readonly DEFAULT_MODE: SimulationMode = 'exact';
    /**
     * Maps backend Circuit representation into qualacs simulation
     */
    static translateAndRun(circuitData: CircuitResponse, options: SimulationOptions = {}): SimulationResult {
        const maxCircuitWidth = options.maxCircuitWidth ?? this.MAX_CIRCUIT_WIDTH;
        const sampleCount = options.sampleCount ?? this.SAMPLE_COUNT;
        const mode: SimulationMode = options.mode ?? this.DEFAULT_MODE;

        const circuitWidth = getCircuitWidth(circuitData);

        // Early return if no circuit is present
        if (circuitWidth === 0) return this.createEmptyResult(circuitWidth);
        if (circuitWidth > maxCircuitWidth) {
            throw new Error(`Circuit exceeds maximum limit of ${maxCircuitWidth} qubits.`);
        }

        // Initialize offset Map
        const offsets = this.calculateRegisterOffsets(circuitData.registers);
        const state = new qulacs.QuantumState(circuitWidth);

        try {
            state.set_zero_state();
            const measurementResults = this.executeCircuit(circuitData, state, offsets, sampleCount);

            return this.processResults(state, measurementResults, circuitWidth, mode, sampleCount);
        } catch (error) {
            console.error('Simulation failed:', error);
            return this.createEmptyResult(circuitWidth);
        } finally {
            // Secure cast on our disposable interface for cleanup (type does not exist)
            (state as unknown as Disposable).delete();
        }
    }

    private static calculateRegisterOffsets(registers: RegisterResponse[]): RegisterOffsets {
        const offsets: RegisterOffsets = {};
        let offsetCount = 0;

        for (const reg of registers) {
            if (isQuantumRegister(reg)) {
                offsets[reg.id] = offsetCount;
                offsetCount += reg.numberOfQubits;
            }
        }
        return offsets;
    }

    private static executeCircuit(
        circuitData: CircuitResponse,
        state: qulacs.QuantumState,
        offsets: RegisterOffsets,
        sampleCount: number,
    ): MeasurementResult[] {
        const measurementResults: MeasurementResult[] = [];

        for (const layer of circuitData.layers) {
            for (const op of layer.quantumOperations) {
                if (op.type === 'ELEMENTARY_QUANTUM_GATE') {
                    this.applyGateToState(state, op, offsets);
                } else if (op.type === 'MEASUREMENT') {
                    measurementResults.push(this.applyMeasurement(state, op, offsets, sampleCount));
                }
            }
        }

        return measurementResults;
    }

    private static applyGateToState(
        state: qulacs.QuantumState,
        op: ElementaryQuantumGateDto,
        offsets: RegisterOffsets,
    ): void {
        const circuit = new qulacs.QuantumCircuit(state.get_qubit_count());

        try {
            this.applyGate(circuit, op, offsets);
            circuit.update_quantum_state(state);
        } finally {
            (circuit as unknown as Disposable).delete();
        }
    }

    /**
     * Applies a single gate to the circuit.
     * Applies a single unitary gate to a short-lived Qulacs circuit.
     *
     * Please be aware that although the qulacs python library is well maintained,
     * the last release of qulacs-wasm was a long time ago and there may be bugs in the gate mapping.
     * In such a case, define the gate using the custom addMatrixGate method,
     * which is a workaround for custom gates from their unitary matrix.
     */
    private static applyGate(circuit: qulacs.QuantumCircuit, op: ElementaryQuantumGateDto, offsets: RegisterOffsets) {
        const type = op.identifier;
        const angle = op.rotationAngle;
        // Resolve global indices
        const targets = op.targetQubits.map((t) => offsets[t.registerId] + t.index);
        const controls = op.controlQubits.map((t) => offsets[t.registerId] + t.index);

        switch (type) {
            case 'H':
                circuit.add_H_gate(targets[0]);
                break;
            case 'X':
                circuit.add_X_gate(targets[0]);
                break;
            case 'Y':
                circuit.add_Y_gate(targets[0]);
                break;
            case 'Z':
                circuit.add_Z_gate(targets[0]);
                break;
            case 'S':
                circuit.add_S_gate(targets[0]);
                break;
            case 'T':
                circuit.add_T_gate(targets[0]);
                break;
            case 'RX':
                circuit.add_RotX_gate(targets[0], angle);
                break;
            case 'RY':
                circuit.add_RotY_gate(targets[0], angle);
                break;
            case 'RZ':
                circuit.add_RotZ_gate(targets[0], angle);
                break;
            case 'CX':
                circuit.add_CNOT_gate(controls[0], targets[0]);
                break;
            case 'CZ':
                circuit.add_CZ_gate(controls[0], targets[0]);
                break;
            case 'SWAP':
                circuit.add_SWAP_gate(targets[0], targets[1]);
                break;
            case 'CCX':
                circuit.add_gate(qulacs.TOFFOLI(controls[0], controls[1], targets[0]));
                break;
            default:
                console.warn(`Gate type ${type} not yet implemented in Translator`);
        }
    }

    private static processResults(
        state: qulacs.QuantumState,
        measurementResults: MeasurementResult[],
        numQubits: number,
        mode: SimulationMode,
        sampleCount: number,
    ): SimulationResult {
        if (mode === 'simulation') {
            const rawResult = state.sampling(sampleCount);
            return {
                stateVector: [],
                counts: this.aggregateSamples(rawResult, numQubits),
                measurementResults,
                simulatedQubits: numQubits,
            };
        }

        if (mode === 'exact') {
            return {
                stateVector: this.extractStateVector(state, numQubits),
                counts: null,
                measurementResults,
                simulatedQubits: numQubits,
            };
        }

        return this.createEmptyResult(numQubits);
    }

    private static applyMeasurement(
        state: qulacs.QuantumState,
        measurement: MeasurementDto,
        offsets: RegisterOffsets,
        sampleCount: number,
    ): MeasurementResult {
        if (measurement.targetQubits.length !== 1 || measurement.classicBits.length !== 1) {
            throw new Error('Only single-qubit measurements with one classic target bit are supported.');
        }

        const targetQubit = measurement.targetQubits[0];
        const classicBit = measurement.classicBits[0];
        const targetIndex = offsets[targetQubit.registerId] + targetQubit.index;
        const probabilities = this.getSingleQubitProbabilities(state, targetIndex);
        const outcome = this.sampleMeasurementOutcome(probabilities);

        this.collapseSingleQubit(state, targetIndex, outcome);

        return {
            operationId: measurement.id,
            targetQubit,
            classicBit,
            outcome,
            probabilities,
            counts: this.countExpectedMeasurementSamples(probabilities, sampleCount),
        };
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

    private static sampleMeasurementOutcome(probabilities: MeasurementResult['probabilities']): 0 | 1 {
        if (probabilities.one <= 0) return 0;
        if (probabilities.zero <= 0) return 1;

        return Math.random() < probabilities.one ? 1 : 0;
    }

    private static collapseSingleQubit(state: qulacs.QuantumState, targetIndex: number, outcome: 0 | 1): void {
        const vec = state.get_vector() as unknown as Complex[];
        const collapsed: Complex[] = vec.map((complex, basisIndex) => {
            if (this.getBit(basisIndex, targetIndex) !== outcome) {
                return { real: 0, imag: 0 };
            }

            return { real: complex.real, imag: complex.imag };
        });

        state.load(collapsed);
        state.normalize(state.get_squared_norm());
    }

    private static countExpectedMeasurementSamples(
        probabilities: MeasurementResult['probabilities'],
        sampleCount: number,
    ): MeasurementResult['counts'] {
        const one = Math.round(probabilities.one * sampleCount);
        return { zero: sampleCount - one, one };
    }

    private static getBit(value: number, bitIndex: number): 0 | 1 {
        return ((value >> bitIndex) & 1) === 1 ? 1 : 0;
    }

    /**
     * Extracts and formats the state vector.
     */
    private static extractStateVector(state: qulacs.QuantumState, numQubits: number): StateVectorEntry[] {
        // safe cast
        const vec = state.get_vector() as unknown as Complex[];

        return vec.map((complex, i) => {
            const { real, imag } = complex;

            // Probability = |alpha|^2
            const prob = real * real + imag * imag;

            // Qulacs Index 'i' is calculated as: sum(q_k * 2^k)
            // toString(2) provides the binary representation where the LSB (Qubit 0)
            // is the rightmost character. This is equivalent to Little Endian representation |q_(n-1)...q_0>.
            const binaryString = i.toString(2).padStart(numQubits, '0');

            return {
                state: `|${binaryString}>`,
                real: real,
                imag: imag,
                prob: prob,
                // To avoid NaN at (0,0), we set phase to 0.
                phase: real === 0 && imag === 0 ? 0 : Math.atan2(imag, real),
            };
        });
    }

    /**
     * Converts raw integer samples from Qulacs into a count dictionary (histogram).
     */
    private static aggregateSamples(samples: number[], numQubits: number): Record<string, number> {
        const counts: Record<string, number> = {};

        for (const sample of samples) {
            // Convert int to binary string, padded to qubit count
            // e.g., 5 -> "101" (for 3 qubits)
            const bitString = sample.toString(2).padStart(numQubits, '0');

            counts[bitString] = (counts[bitString] || 0) + 1;
        }

        return counts;
    }

    private static createEmptyResult(numQubits: number): SimulationResult {
        return { stateVector: [], counts: null, measurementResults: [], simulatedQubits: numQubits };
    }
}
