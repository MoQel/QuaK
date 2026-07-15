import { describe, it, expect, beforeAll } from 'vitest';
import { CircuitTranslator } from './CircuitTranslator';
import { initQulacs } from 'qulacs-wasm';
import {
    CircuitResponse,
    ClassicRegisterResponse,
    ElementaryQuantumGateDto,
    LayerResponse,
    MeasurementDto,
    QuantumOperationDto,
    QuantumRegisterResponse,
    REGISTER_TYPE_CLASSIC,
    REGISTER_TYPE_QUANTUM,
} from '@/api/dto/circuit';
import { OperationIdentifier } from '@/lib/operations.ts';
import { SimulationResult } from '@/simulation/simulation.types.ts';

const createCircuit = (
    numQubits: number,
    operations: QuantumOperationDto[] = [],
    classicBits: number = 0,
): CircuitResponse => {
    const registers: QuantumRegisterResponse[] = [
        {
            id: 'qreg-0',
            name: 'q',
            type: REGISTER_TYPE_QUANTUM,
            numberOfQubits: numQubits,
        },
    ];

    const classicRegisters: ClassicRegisterResponse[] =
        classicBits > 0
            ? [
                  {
                      id: 'creg-0',
                      name: 'c',
                      type: REGISTER_TYPE_CLASSIC,
                      numberOfBits: classicBits,
                  },
              ]
            : [];

    const layers: LayerResponse[] = operations.length ? [{ quantumOperations: operations }] : [];

    return {
        id: 'test-circuit',
        registers: [...registers, ...classicRegisters],
        layers,
    };
};

const createCircuitWithClassicRegisters = (
    numQubits: number,
    operations: QuantumOperationDto[],
    classicRegisters: Array<{ id: string; name: string; numberOfBits: number }>,
): CircuitResponse => {
    const registers: QuantumRegisterResponse[] = [
        {
            id: 'qreg-0',
            name: 'q',
            type: REGISTER_TYPE_QUANTUM,
            numberOfQubits: numQubits,
        },
    ];

    const classics: ClassicRegisterResponse[] = classicRegisters.map((register) => ({
        id: register.id,
        name: register.name,
        type: REGISTER_TYPE_CLASSIC,
        numberOfBits: register.numberOfBits,
    }));

    return {
        id: 'test-circuit-multi-classic',
        registers: [...registers, ...classics],
        layers: operations.length ? [{ quantumOperations: operations }] : [],
    };
};

const gate = (
    definitionId: OperationIdentifier,
    targetIndex: number = 0,
    rotationAngle: number = 0,
): ElementaryQuantumGateDto => ({
    id: crypto.randomUUID(),
    type: 'ELEMENTARY_QUANTUM_GATE',
    identifier: definitionId,
    inverseForm: false,
    rotationAngle: rotationAngle,
    targetQubits: [{ registerId: 'qreg-0', index: targetIndex }],
    controlQubits: [],
});

const multiGate = (
    definitionId: OperationIdentifier,
    controls: number[],
    targets: number[],
): ElementaryQuantumGateDto => ({
    id: 'test-id-multi',
    type: 'ELEMENTARY_QUANTUM_GATE',
    identifier: definitionId,
    inverseForm: false,
    rotationAngle: 0,
    targetQubits: targets.map((idx) => ({ registerId: 'qreg-0', index: idx })),
    controlQubits: controls.map((idx) => ({ registerId: 'qreg-0', index: idx })),
});

const measurement = (
    targetIndex: number = 0,
    classicIndex: number = 0,
    id: string = `test-measurement-${targetIndex}-${classicIndex}`,
): MeasurementDto => ({
    id,
    type: 'MEASUREMENT',
    identifier: 'MEASURE',
    inverseForm: false,
    targetQubits: [{ registerId: 'qreg-0', index: targetIndex }],
    controlQubits: [],
    classicBits: [{ registerId: 'creg-0', index: classicIndex }],
});

describe('CircuitTranslator', () => {
    beforeAll(async () => {
        await initQulacs();
    });

    describe('Basic Initialization', () => {
        it('should handle an empty circuit (0 qubits) gracefully', () => {
            const circuit = createCircuit(0);
            const result = CircuitTranslator.translateAndRun(circuit);

            expect(result.stateVector).toHaveLength(0);
            expect(result.counts).toBeNull();
        });

        it('should initialize a single qubit to state |0> (Identity)', () => {
            const circuit = createCircuit(1);
            const result = CircuitTranslator.translateAndRun(circuit);

            expect(result.stateVector).toHaveLength(2);

            expect(result.stateVector[0].state).toBe('|0>');
            expect(result.stateVector[0].prob).toBeCloseTo(1);
            expect(result.stateVector[1].prob).toBeCloseTo(0);
        });
    });

    describe('Single Qubit Gates', () => {
        it('should apply X gate (Bit Flip)', () => {
            const circuit = createCircuit(1, [gate('X')]);

            const result = CircuitTranslator.translateAndRun(circuit);

            expect(result.stateVector[0].prob).toBeCloseTo(0.0);
            expect(result.stateVector[1].state).toBe('|1>');
            expect(result.stateVector[1].prob).toBeCloseTo(1);
        });

        it('should apply H gate (Superposition)', () => {
            const circuit = createCircuit(1, [gate('H')]);

            const result = CircuitTranslator.translateAndRun(circuit);

            expect(result.stateVector[0].prob).toBeCloseTo(0.5);
            expect(result.stateVector[1].prob).toBeCloseTo(0.5);
        });
    });

    describe('Configuration & Limits', () => {
        it('should throw an error if circuit exceeds max circuit width', () => {
            const circuit = createCircuit(3, [gate('X', 0), gate('X', 1), gate('X', 2)]);

            expect(() => {
                CircuitTranslator.translateAndRun(circuit, {
                    maxCircuitWidth: 2,
                });
            }).toThrow(/Circuit exceeds maximum limit/);
        });

        it('should respect custom sampleCount', () => {
            const circuit = createCircuit(1, [measurement()], 1);

            const result = CircuitTranslator.translateAndRun(circuit, {
                sampleCount: 10,
                mode: 'simulation',
            });

            expect(result.counts).not.toBeNull();

            const totalSamples = Object.values(result.counts!).reduce((a, b) => a + b, 0);

            expect(totalSamples).toBe(10);
        });

        it('should sample the quantum state in simulation mode without measurement gates', () => {
            const circuit = createCircuit(1, [gate('X')]);

            const result = CircuitTranslator.translateAndRun(circuit, {
                sampleCount: 6,
                mode: 'simulation',
            });

            expect(result.status).toBe('COMPLETED');
            expect(result.counts).toEqual({ '1': 6 });
            expect(result.readoutRegisters).toBeUndefined();
            expect(result.measurementResults).toHaveLength(0);
        });
    });

    describe('Measurements', () => {
        it('should return a deterministic single qubit measurement result for |1>', () => {
            const circuit = createCircuit(1, [gate('X'), measurement()], 1);

            const result = CircuitTranslator.translateAndRun(circuit);

            expect(result.measurementResults).toHaveLength(1);
            expect(result.measurementResults[0].probabilities.zero).toBeCloseTo(0);
            expect(result.measurementResults[0].probabilities.one).toBeCloseTo(1);
            expect(result.measurementResults[0].outcome).toBe(1);
            expect(result.measurementResults[0].classicBit).toEqual({ registerId: 'creg-0', index: 0 });
        });

        it('should return balanced probabilities for measuring H|0>', () => {
            const circuit = createCircuit(1, [gate('H'), measurement()], 1);

            const result = CircuitTranslator.translateAndRun(circuit);

            expect(result.measurementResults).toHaveLength(1);
            expect(result.measurementResults[0].probabilities.zero).toBeCloseTo(0.5);
            expect(result.measurementResults[0].probabilities.one).toBeCloseTo(0.5);
        });

        it('should include sampled measurement counts in simulation mode', () => {
            const circuit = createCircuit(1, [gate('X'), measurement()], 1);

            const result = CircuitTranslator.translateAndRun(circuit, {
                sampleCount: 10,
                mode: 'simulation',
            });

            expect(result.measurementResults[0].counts).toEqual({ zero: 0, one: 10 });
        });

        it('should aggregate simulation counts by classical target bit positions', () => {
            const circuit = createCircuit(4, [gate('X', 3), measurement(3, 3)], 4);

            const result = CircuitTranslator.translateAndRun(circuit, {
                sampleCount: 8,
                mode: 'simulation',
            });

            expect(result.counts).toEqual({ '0001': 8 });
        });

        it('should keep unmeasured classical bits at zero', () => {
            const circuit = createCircuit(1, [gate('X', 0), measurement(0, 2)], 4);

            const result = CircuitTranslator.translateAndRun(circuit, {
                sampleCount: 8,
                mode: 'simulation',
            });

            expect(result.counts).toEqual({ '0010': 8 });
        });

        it('should derive histogram labels from classical destinations instead of qubit order', () => {
            const circuit = createCircuit(
                2,
                [gate('X', 0), measurement(0, 1, 'm-q0-c1'), measurement(1, 0, 'm-q1-c0')],
                2,
            );

            const result = CircuitTranslator.translateAndRun(circuit, {
                sampleCount: 8,
                mode: 'simulation',
            });

            expect(result.counts).toEqual({ '01': 8 });
            expect(result.outcomes?.[0].registerValues).toEqual({ c: '01' });
        });

        it('should format classical readout keys in displayed classical bit order', () => {
            const circuit = createCircuit(
                4,
                [gate('X', 0), gate('X', 1), measurement(0, 0), measurement(1, 1), measurement(2, 2), measurement(3, 3)],
                4,
            );

            const result = CircuitTranslator.translateAndRun(circuit, {
                sampleCount: 8,
                mode: 'simulation',
            });

            expect(result.counts).toEqual({ '1100': 8 });
        });

        it('should distinguish q[3] -> c[3] from q[3] -> c[0] in simulation mode', () => {
            const highBitCircuit = createCircuit(4, [gate('X', 3), measurement(3, 3)], 4);
            const lowBitCircuit = createCircuit(4, [gate('X', 3), measurement(3, 0)], 4);

            const highBitResult = CircuitTranslator.translateAndRun(highBitCircuit, {
                sampleCount: 8,
                mode: 'simulation',
            });
            const lowBitResult = CircuitTranslator.translateAndRun(lowBitCircuit, {
                sampleCount: 8,
                mode: 'simulation',
            });

            expect(highBitResult.counts).toEqual({ '0001': 8 });
            expect(lowBitResult.counts).toEqual({ '1000': 8 });
        });

        it('should preserve classical register boundaries in readout keys', () => {
            const circuit = createCircuitWithClassicRegisters(
                2,
                [
                    gate('X', 0),
                    gate('X', 1),
                    {
                        id: 'm-c',
                        type: 'MEASUREMENT',
                        identifier: 'MEASURE',
                        inverseForm: false,
                        targetQubits: [{ registerId: 'qreg-0', index: 0 }],
                        controlQubits: [],
                        classicBits: [{ registerId: 'creg-c', index: 0 }],
                    },
                    {
                        id: 'm-result',
                        type: 'MEASUREMENT',
                        identifier: 'MEASURE',
                        inverseForm: false,
                        targetQubits: [{ registerId: 'qreg-0', index: 1 }],
                        controlQubits: [],
                        classicBits: [{ registerId: 'creg-result', index: 2 }],
                    },
                ],
                [
                    { id: 'creg-c', name: 'c', numberOfBits: 2 },
                    { id: 'creg-result', name: 'result', numberOfBits: 3 },
                ],
            );

            const result = CircuitTranslator.translateAndRun(circuit, {
                sampleCount: 4,
                mode: 'simulation',
            });

            expect(result.counts).toEqual({ '001 10': 4 });
            expect(result.readoutRegisters).toEqual([
                { registerId: 'creg-result', name: 'result', size: 3 },
                { registerId: 'creg-c', name: 'c', size: 2 },
            ]);
            expect(result.outcomes).toEqual([
                {
                    combinedKey: '001 10',
                    registerValues: { result: '001', c: '10' },
                    count: 4,
                    probability: 1,
                    percentage: 100,
                },
            ]);
        });

        it('should preserve Bell-state correlations in shot-based measurement', () => {
            const circuit = createCircuit(
                2,
                [gate('H', 0), multiGate('CX', [0], [1]), measurement(0, 0, 'm-q0-c0'), measurement(1, 1, 'm-q1-c1')],
                2,
            );

            const result = CircuitTranslator.translateAndRun(circuit, {
                sampleCount: 4096,
                mode: 'simulation',
            });

            expect((result.counts?.['00'] ?? 0) + (result.counts?.['11'] ?? 0)).toBe(4096);
            expect(result.counts?.['01'] ?? 0).toBe(0);
            expect(result.counts?.['10'] ?? 0).toBe(0);
            expect((result.counts?.['00'] ?? 0) / 4096).toBeGreaterThanOrEqual(0.4);
            expect((result.counts?.['00'] ?? 0) / 4096).toBeLessThanOrEqual(0.6);
        });

        it('should repeat the same result after measuring a collapsed qubit again', () => {
            const circuit = createCircuit(1, [gate('H'), measurement(0, 0, 'm-first'), measurement(0, 1, 'm-second')], 2);

            const result = CircuitTranslator.translateAndRun(circuit, {
                sampleCount: 512,
                mode: 'simulation',
            });

            expect(Object.keys(result.counts ?? {}).every((key) => ['00', '11'].includes(key))).toBe(true);
            expect(result.counts?.['01'] ?? 0).toBe(0);
            expect(result.counts?.['10'] ?? 0).toBe(0);
            expect(Object.values(result.counts ?? {}).reduce((sum, count) => sum + count, 0)).toBe(512);
        });

        it('should let gates after a measurement operate on the collapsed state', () => {
            const circuit = createCircuit(
                1,
                [gate('H'), measurement(0, 0, 'm-before-x'), gate('X'), measurement(0, 1, 'm-after-x')],
                2,
            );

            const result = CircuitTranslator.translateAndRun(circuit, {
                sampleCount: 512,
                mode: 'simulation',
            });

            expect(result.counts?.['00'] ?? 0).toBe(0);
            expect(result.counts?.['11'] ?? 0).toBe(0);
            expect((result.counts?.['01'] ?? 0) + (result.counts?.['10'] ?? 0)).toBe(512);
        });

        it('should let later measurements overwrite earlier writes to the same classical bit', () => {
            const circuit = createCircuit(
                2,
                [gate('X', 0), measurement(0, 0, 'm-write-one'), measurement(1, 0, 'm-overwrite-zero')],
                1,
            );

            const result = CircuitTranslator.translateAndRun(circuit, {
                sampleCount: 8,
                mode: 'simulation',
            });

            expect(result.counts).toEqual({ '0': 8 });
        });

        it('should reject measurements that reference a missing classical register', () => {
            const circuit = createCircuit(1, [measurement()], 0);

            expect(() =>
                CircuitTranslator.translateAndRun(circuit, {
                    sampleCount: 8,
                    mode: 'simulation',
                }),
            ).toThrow(/CLASSICAL_REGISTER_NOT_FOUND/);
        });

        it('should reject malformed register-wide measurements with mismatched sizes', () => {
            const registerMeasurement: MeasurementDto = {
                id: 'm-register',
                type: 'MEASUREMENT',
                identifier: 'MEASURE',
                inverseForm: false,
                targetQubits: [
                    { registerId: 'qreg-0', index: 0 },
                    { registerId: 'qreg-0', index: 1 },
                    { registerId: 'qreg-0', index: 2 },
                ],
                controlQubits: [],
                classicBits: [
                    { registerId: 'creg-c', index: 0 },
                    { registerId: 'creg-c', index: 1 },
                ],
            };
            const circuit = createCircuitWithClassicRegisters(
                3,
                [registerMeasurement],
                [{ id: 'creg-c', name: 'c', numberOfBits: 2 }],
            );

            expect(() =>
                CircuitTranslator.translateAndRun(circuit, {
                    sampleCount: 8,
                    mode: 'simulation',
                }),
            ).toThrow(/MEASUREMENT_REGISTER_SIZE_MISMATCH/);
        });

        it('should collapse the state before applying later gates', () => {
            const circuit = createCircuit(1, [gate('X'), measurement(), gate('X')], 1);

            const result = CircuitTranslator.translateAndRun(circuit);

            expect(result.measurementResults[0].outcome).toBe(1);
            expect(result.stateVector[0].state).toBe('|0>');
            expect(result.stateVector[0].prob).toBeCloseTo(1);
            expect(result.stateVector[1].prob).toBeCloseTo(0);
        });

        it('should normalize the state after a probabilistic measurement', () => {
            const circuit = createCircuit(1, [gate('H'), measurement()], 1);

            const result = CircuitTranslator.translateAndRun(circuit);
            const totalProbability = result.stateVector.reduce((sum, entry) => sum + entry.prob, 0);

            expect(totalProbability).toBeCloseTo(1);
            expect(result.stateVector.filter((entry) => entry.prob > 0.99)).toHaveLength(1);
        });

        it('should handle multiple measurements in sequence', () => {
            const circuit = createCircuit(2, [gate('X', 0), measurement(0, 0), gate('X', 1), measurement(1, 1)], 2);

            const result = CircuitTranslator.translateAndRun(circuit);

            expect(result.measurementResults).toHaveLength(2);
            expect(result.measurementResults[0].outcome).toBe(1);
            expect(result.measurementResults[1].outcome).toBe(1);
            expect(result.measurementResults[0].classicBit).toEqual({ registerId: 'creg-0', index: 0 });
            expect(result.measurementResults[1].classicBit).toEqual({ registerId: 'creg-0', index: 1 });
            expect(result.stateVector.find((entry) => entry.state === '|11>')?.prob).toBeCloseTo(1);
        });

        it('should measure all remaining qubits at the end when final sweep is enabled', () => {
            const circuit = createCircuit(2, [gate('X', 1)], 0);

            const result = CircuitTranslator.translateAndRun(circuit, {
                measurementMode: 'measurement-gates-plus-final',
            });

            expect(result.measurementResults).toHaveLength(2);
            expect(result.measurementResults[0].targetQubit).toEqual({ registerId: 'qreg-0', index: 0 });
            expect(result.measurementResults[0].classicBit).toEqual({ registerId: '__auto__', index: 0 });
            expect(result.measurementResults[0].outcome).toBe(0);
            expect(result.measurementResults[1].targetQubit).toEqual({ registerId: 'qreg-0', index: 1 });
            expect(result.measurementResults[1].classicBit).toEqual({ registerId: '__auto__', index: 1 });
            expect(result.measurementResults[1].outcome).toBe(1);
        });

        it('should keep the exact state view unchanged before automatic final measurements', () => {
            const circuit = createCircuit(1, [gate('H')], 0);

            const result = CircuitTranslator.translateAndRun(circuit, {
                measurementMode: 'measurement-gates-plus-final',
                mode: 'exact',
            });

            expect(result.measurementResults).toHaveLength(1);
            expect(result.stateVector[0].prob).toBeCloseTo(0.5);
            expect(result.stateVector[1].prob).toBeCloseTo(0.5);
        });

        it('should run automatic final measurements shot-by-shot in simulation mode', () => {
            const circuit = createCircuit(1, [gate('X')], 0);

            const result = CircuitTranslator.translateAndRun(circuit, {
                measurementMode: 'measurement-gates-plus-final',
                mode: 'simulation',
                sampleCount: 4,
            });

            expect(result.counts).toEqual({ '1': 4 });
            expect(result.measurementResults).toHaveLength(1);
        });
    });

    describe('CircuitTranslator - Gate Mapping Tests', () => {
        const findState = (result: SimulationResult, stateStr: string) => {
            const state = result.stateVector.find((s) => s.state === stateStr);
            if (!state) throw new Error(`State ${stateStr} not found in state vector`);
            return state;
        };

        it('validates X gate (Pauli-X)', () => {
            let circuit = createCircuit(1, [gate('X', 0)]);
            expect(findState(CircuitTranslator.translateAndRun(circuit), '|1>').prob).toBeCloseTo(1);

            circuit = createCircuit(1, [gate('X', 0), gate('X', 0)]);
            expect(findState(CircuitTranslator.translateAndRun(circuit), '|0>').prob).toBeCloseTo(1);
        });

        it('validates H gate (Hadamard)', () => {
            const circuit = createCircuit(1, [gate('H', 0)]);
            const result = CircuitTranslator.translateAndRun(circuit);
            expect(findState(result, '|0>').prob).toBeCloseTo(0.5);
            expect(findState(result, '|1>').prob).toBeCloseTo(0.5);
        });

        it('validates Y gate (Pauli-Y)', () => {
            const circuit = createCircuit(1, [gate('Y', 0)]);
            const result = CircuitTranslator.translateAndRun(circuit);
            const state1 = findState(result, '|1>');
            expect(state1.prob).toBeCloseTo(1);
            expect(state1.phase).toBeCloseTo(Math.PI / 2);
        });

        it('validates Z gate (Pauli-Z)', () => {
            const circuit = createCircuit(1, [gate('H', 0), gate('Z', 0)]);
            const result = CircuitTranslator.translateAndRun(circuit);
            const state1 = findState(result, '|1>');
            expect(state1.prob).toBeCloseTo(0.5);
            expect(Math.abs(state1.phase)).toBeCloseTo(Math.PI);
        });

        it('validates S gate', () => {
            const circuit = createCircuit(1, [gate('H', 0), gate('S', 0)]);
            const result = CircuitTranslator.translateAndRun(circuit);
            const state1 = findState(result, '|1>');
            expect(state1.prob).toBeCloseTo(0.5);
            expect(state1.phase).toBeCloseTo(Math.PI / 2);
        });

        it('validates T gate', () => {
            const circuit = createCircuit(1, [gate('H', 0), gate('T', 0)]);
            const result = CircuitTranslator.translateAndRun(circuit);
            const state1 = findState(result, '|1>');
            expect(state1.prob).toBeCloseTo(0.5);
            expect(state1.phase).toBeCloseTo(Math.PI / 4);
        });

        it('validates RX gate with angle override check', () => {
            const circuit = createCircuit(1, [gate('RX', 0, Math.PI / 2)]);
            const result = CircuitTranslator.translateAndRun(circuit);

            const state1 = findState(result, '|1>');
            expect(state1.prob).toBeCloseTo(0.5);
            expect(state1.phase).toBeCloseTo(-Math.PI / 2);
        });

        it('validates RY gate with angle override check', () => {
            const circuit = createCircuit(1, [gate('RY', 0, Math.PI / 2)]);
            const result = CircuitTranslator.translateAndRun(circuit);

            const state1 = findState(result, '|1>');
            expect(state1.prob).toBeCloseTo(0.5);
            expect(state1.phase).toBeCloseTo(0);
        });

        it('validates RZ gate with angle override check', () => {
            const circuit = createCircuit(1, [gate('H', 0), gate('RZ', 0, Math.PI / 2)]);
            const result = CircuitTranslator.translateAndRun(circuit);

            const state1 = findState(result, '|1>');
            expect(state1.prob).toBeCloseTo(0.5);
            expect(state1.phase).toBeCloseTo(Math.PI / 4);
        });

        it('validates CX (CNOT) gate exhaustively', () => {
            let circuit = createCircuit(2, [multiGate('CX', [0], [1])]);
            expect(findState(CircuitTranslator.translateAndRun(circuit), '|00>').prob).toBeCloseTo(1);

            circuit = createCircuit(2, [gate('X', 0), multiGate('CX', [0], [1])]);
            expect(findState(CircuitTranslator.translateAndRun(circuit), '|11>').prob).toBeCloseTo(1);
        });

        it('validates CZ gate exhaustively', () => {
            const circuit = createCircuit(2, [gate('H', 0), gate('H', 1), multiGate('CZ', [0], [1])]);
            const result = CircuitTranslator.translateAndRun(circuit);

            expect(Math.abs(findState(result, '|00>').phase)).toBeCloseTo(0);
            expect(Math.abs(findState(result, '|01>').phase)).toBeCloseTo(0);
            expect(Math.abs(findState(result, '|10>').phase)).toBeCloseTo(0);
            expect(Math.abs(findState(result, '|11>').phase)).toBeCloseTo(Math.PI);
        });

        it('validates SWAP gate exhaustively', () => {
            let circuit = createCircuit(2, [gate('X', 0), multiGate('SWAP', [], [0, 1])]);
            expect(findState(CircuitTranslator.translateAndRun(circuit), '|10>').prob).toBeCloseTo(1);

            circuit = createCircuit(2, [gate('X', 1), multiGate('SWAP', [], [0, 1])]);
            expect(findState(CircuitTranslator.translateAndRun(circuit), '|01>').prob).toBeCloseTo(1);

            circuit = createCircuit(2, [gate('X', 0), gate('X', 1), multiGate('SWAP', [], [0, 1])]);
            expect(findState(CircuitTranslator.translateAndRun(circuit), '|11>').prob).toBeCloseTo(1);
        });

        it('validates CCX (Toffoli) gate exhaustively', () => {
            let circuit = createCircuit(3, [multiGate('CCX', [0, 1], [2])]);
            expect(findState(CircuitTranslator.translateAndRun(circuit), '|000>').prob).toBeCloseTo(1);

            circuit = createCircuit(3, [gate('X', 0), multiGate('CCX', [0, 1], [2])]);
            expect(findState(CircuitTranslator.translateAndRun(circuit), '|001>').prob).toBeCloseTo(1);

            circuit = createCircuit(3, [gate('X', 1), multiGate('CCX', [0, 1], [2])]);
            expect(findState(CircuitTranslator.translateAndRun(circuit), '|010>').prob).toBeCloseTo(1);

            circuit = createCircuit(3, [gate('X', 0), gate('X', 1), multiGate('CCX', [0, 1], [2])]);
            expect(findState(CircuitTranslator.translateAndRun(circuit), '|111>').prob).toBeCloseTo(1);

            circuit = createCircuit(3, [gate('X', 0), gate('X', 1), gate('X', 2), multiGate('CCX', [0, 1], [2])]);
            expect(findState(CircuitTranslator.translateAndRun(circuit), '|011>').prob).toBeCloseTo(1);
        });
    });
});
