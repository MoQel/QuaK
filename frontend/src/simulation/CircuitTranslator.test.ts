import { describe, it, expect, beforeAll } from 'vitest';
import { CircuitTranslator } from './CircuitTranslator';
import { initQulacs } from 'qulacs-wasm'; // Namespace import for robust WASM handling
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

// --- Test Helpers ---

/**
 * Helper to construct a strictly typed mock circuit.
 * Allows defining multiple registers with varying number of gates.
 */
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

/**
 * Helper to create an ElementaryQuantumGate object.
 */
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

const measurement = (targetIndex: number = 0, classicIndex: number = 0): MeasurementDto => ({
    id: 'test-measurement',
    type: 'MEASUREMENT',
    identifier: 'MEASURE',
    inverseForm: false,
    targetQubits: [{ registerId: 'qreg-0', index: targetIndex }],
    controlQubits: [],
    classicBits: [{ registerId: 'creg-0', index: classicIndex }],
});

// --- Tests ---

describe('CircuitTranslator', () => {
    // Robust initialization for Qulacs in Node/Vitest environment
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
    });

    describe('CircuitTranslator - Gate Mapping Tests', () => {
        // Helper to extract a specific state from the result vector
        const findState = (result: SimulationResult, stateStr: string) => {
            const state = result.stateVector.find((s) => s.state === stateStr);
            if (!state) throw new Error(`State ${stateStr} not found in state vector`);
            return state;
        };

        it('validates X gate (Pauli-X)', () => {
            let circuit = createCircuit(1, [gate('X', 0)]);
            expect(findState(CircuitTranslator.translateAndRun(circuit), '|1>').prob).toBeCloseTo(1);

            // 1 -> 0
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
            // RX(pi/2)|0> = 1/sqrt(2)(|0> - i|1>) -> phase of |1> should be -pi/2
            expect(state1.phase).toBeCloseTo(-Math.PI / 2);
        });

        it('validates RY gate with angle override check', () => {
            const circuit = createCircuit(1, [gate('RY', 0, Math.PI / 2)]);
            const result = CircuitTranslator.translateAndRun(circuit);

            const state1 = findState(result, '|1>');
            expect(state1.prob).toBeCloseTo(0.5);
            // RY(pi/2)|0> = 1/sqrt(2)(|0> + |1>) -> phase is 0
            expect(state1.phase).toBeCloseTo(0);
        });

        it('validates RZ gate with angle override check', () => {
            // Apply H to enter superposition, then RZ(pi/2)
            const circuit = createCircuit(1, [gate('H', 0), gate('RZ', 0, Math.PI / 2)]);
            const result = CircuitTranslator.translateAndRun(circuit);

            const state1 = findState(result, '|1>');
            expect(state1.prob).toBeCloseTo(0.5);
            // Qulacs RZ formula check: phase should reflect the -angle fix
            expect(state1.phase).toBeCloseTo(Math.PI / 4);
        });

        it('validates CX (CNOT) gate exhaustively', () => {
            // Case 1: Control = 0 -> Target stays 0 -> |00>
            let circuit = createCircuit(2, [multiGate('CX', [0], [1])]);
            expect(findState(CircuitTranslator.translateAndRun(circuit), '|00>').prob).toBeCloseTo(1);

            // Case 2: Control = 1 -> Target flips to 1 -> |11>
            circuit = createCircuit(2, [gate('X', 0), multiGate('CX', [0], [1])]);
            expect(findState(CircuitTranslator.translateAndRun(circuit), '|11>').prob).toBeCloseTo(1);
        });

        it('validates CZ gate exhaustively', () => {
            // Superposition on Q0 and Q1 -> creates |00>, |01>, |10>, |11>
            const circuit = createCircuit(2, [gate('H', 0), gate('H', 1), multiGate('CZ', [0], [1])]);
            const result = CircuitTranslator.translateAndRun(circuit);

            // Phase should ONLY be flipped for |11>
            expect(Math.abs(findState(result, '|00>').phase)).toBeCloseTo(0);
            expect(Math.abs(findState(result, '|01>').phase)).toBeCloseTo(0);
            expect(Math.abs(findState(result, '|10>').phase)).toBeCloseTo(0);
            expect(Math.abs(findState(result, '|11>').phase)).toBeCloseTo(Math.PI);
        });

        it('validates SWAP gate exhaustively', () => {
            // Case 1: |01> (Q0=1, Q1=0) -> SWAP -> |10>
            let circuit = createCircuit(2, [gate('X', 0), multiGate('SWAP', [], [0, 1])]);
            expect(findState(CircuitTranslator.translateAndRun(circuit), '|10>').prob).toBeCloseTo(1);

            // Case 2: |10> (Q0=0, Q1=1) -> SWAP -> |01>
            circuit = createCircuit(2, [gate('X', 1), multiGate('SWAP', [], [0, 1])]);
            expect(findState(CircuitTranslator.translateAndRun(circuit), '|01>').prob).toBeCloseTo(1);

            // Case 3: |11> -> SWAP -> |11> (should do nothing if both are 1)
            circuit = createCircuit(2, [gate('X', 0), gate('X', 1), multiGate('SWAP', [], [0, 1])]);
            expect(findState(CircuitTranslator.translateAndRun(circuit), '|11>').prob).toBeCloseTo(1);
        });

        it('validates CCX (Toffoli) gate exhaustively', () => {
            // Case 1: Controls = 00 -> Target stays 0 -> |000>
            let circuit = createCircuit(3, [multiGate('CCX', [0, 1], [2])]);
            expect(findState(CircuitTranslator.translateAndRun(circuit), '|000>').prob).toBeCloseTo(1);

            // Case 2: Controls = 10 (Q0=1) -> Target stays 0 -> |001>
            circuit = createCircuit(3, [gate('X', 0), multiGate('CCX', [0, 1], [2])]);
            expect(findState(CircuitTranslator.translateAndRun(circuit), '|001>').prob).toBeCloseTo(1);

            // Case 3: Controls = 01 (Q1=1) -> Target stays 0 -> |010>
            circuit = createCircuit(3, [gate('X', 1), multiGate('CCX', [0, 1], [2])]);
            expect(findState(CircuitTranslator.translateAndRun(circuit), '|010>').prob).toBeCloseTo(1);

            // Case 4: Controls = 11 -> Target flips to 1 -> |111>
            circuit = createCircuit(3, [gate('X', 0), gate('X', 1), multiGate('CCX', [0, 1], [2])]);
            expect(findState(CircuitTranslator.translateAndRun(circuit), '|111>').prob).toBeCloseTo(1);

            // Case 5: Target is already 1, Controls = 11 -> Target flips to 0 -> |011>
            circuit = createCircuit(3, [gate('X', 0), gate('X', 1), gate('X', 2), multiGate('CCX', [0, 1], [2])]);
            expect(findState(CircuitTranslator.translateAndRun(circuit), '|011>').prob).toBeCloseTo(1);
        });
    });
});
