import { describe, it, expect, beforeAll } from 'vitest';
import { CircuitTranslator } from './CircuitTranslator';
import { initQulacs } from 'qulacs-wasm'; // Namespace import for robust WASM handling
import { CircuitResponse, GateResponse, RegisterResponse } from '@/api/dto/circuit';
import { GateDefinitionIdentifier } from '@/api/dto/GateDefinitionIdentifier.ts';

// --- Test Helpers ---

/**
 * Helper to construct a strictly typed mock circuit.
 * Allows defining multiple registers with varying number of gates.
 */
const createCircuit = (qubitConfigs: GateResponse[][]): CircuitResponse => {
    const registers: RegisterResponse[] = qubitConfigs.map((gates, index) => ({
        id: `reg-${index}`,
        name: `q${index}`,
        qubits: [
            {
                id: `qubit-${index}`,
                gates: gates,
            },
        ],
    }));

    return {
        id: 'test-circuit',
        registers: registers,
    };
};

/**
 * Helper to create a Gate object.
 */
const gate = (definitionId: string): GateResponse => ({
    id: `gate-${Math.random()}`,
    definitionId: definitionId as GateDefinitionIdentifier,
});

// --- Tests ---

describe('CircuitTranslator', () => {
    // Robust initialization for Qulacs in Node/Vitest environment
    beforeAll(async () => {
        await initQulacs();
    });

    describe('Basic Initialization', () => {
        it('should handle an empty circuit (0 qubits) gracefully', () => {
            const circuit = createCircuit([]);
            const result = CircuitTranslator.translateAndRun(circuit);

            expect(result.stateVector).toHaveLength(0);
            expect(result.counts).toBeNull();
        });

        it('should initialize a single qubit to state |0> (Identity)', () => {
            // 1 Qubit, 0 Gates
            const circuit = createCircuit([[]]);
            const result = CircuitTranslator.translateAndRun(circuit);

            expect(result.stateVector).toHaveLength(2); // 2^1 states

            // Check |0>
            expect(result.stateVector[0].state).toBe('|0>');
            expect(result.stateVector[0].prob).toBeCloseTo(1.0);

            // Check |1>
            expect(result.stateVector[1].prob).toBeCloseTo(0.0);
        });
    });

    describe('Single Qubit Gates', () => {
        it('should apply X gate (Bit Flip)', () => {
            // 1 Qubit: [X]
            const circuit = createCircuit([[gate('X')]]);
            const result = CircuitTranslator.translateAndRun(circuit);

            // Expect |1> with 100% probability
            expect(result.stateVector[0].prob).toBeCloseTo(0.0);
            expect(result.stateVector[1].state).toBe('|1>');
            expect(result.stateVector[1].prob).toBeCloseTo(1.0);
        });

        it('should apply H gate (Superposition)', () => {
            // 1 Qubit: [H]
            const circuit = createCircuit([[gate('H')]]);
            const result = CircuitTranslator.translateAndRun(circuit);

            // Expect |0> and |1> to have 0.5 probability each
            expect(result.stateVector[0].prob).toBeCloseTo(0.5);
            expect(result.stateVector[1].prob).toBeCloseTo(0.5);
        });

        it('should ignore PLACEHOLDER gates', () => {
            // 1 Qubit: [PLACEHOLDER, X]
            const circuit = createCircuit([[gate('PLACEHOLDER'), gate('X')]]);
            const result = CircuitTranslator.translateAndRun(circuit);

            // Should behave exactly like just [X]
            expect(result.stateVector[1].prob).toBeCloseTo(1.0);
        });
    });

    describe('Error Handling', () => {
        it('should handle unknown gates gracefully', () => {
            const circuit = createCircuit([[gate('UNKNOWN_GATE')]]);

            // Should not throw, but warn (console.warn mocked or ignored) and proceed as Identity
            const result = CircuitTranslator.translateAndRun(circuit);

            // State should remain |0>
            expect(result.stateVector[0].prob).toBeCloseTo(1.0);
        });
    });

    describe('Configuration & Limits', () => {
        it('should respect custom maxQubits limit', () => {
            // Create 3 registers, each with 1 qubit
            const circuit = createCircuit([
                [gate('X')], // Reg 0
                [gate('X')], // Reg 1
                [gate('X')], // Reg 2
            ]);

            // Set limit to 2
            const result = CircuitTranslator.translateAndRun(circuit, { maxQubits: 2 });

            expect(result.stateVector).toHaveLength(4);
            expect(result.stateVector[3].state).toBe('|11>');
            expect(result.stateVector[3].prob).toBeCloseTo(1.0);
        });

        it('should respect custom sampleCount', () => {
            const circuit = createCircuit([[gate('MEASURE')]]); // Zustand |0>

            // We only want 10 samples instead of 1024
            const result = CircuitTranslator.translateAndRun(circuit, {
                sampleCount: 10,
                mode: 'simulation',
            });

            expect(result.counts).not.toBeNull();
            // Number of shots should be 10
            const totalSamples = Object.values(result.counts!).reduce((a, b) => a + b, 0);
            expect(totalSamples).toBe(10);
        });
    });
});
