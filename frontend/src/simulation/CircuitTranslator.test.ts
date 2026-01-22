import { describe, it, expect, beforeAll } from 'vitest';
import { CircuitTranslator } from './CircuitTranslator';
import { initQulacs } from 'qulacs-wasm'; // Namespace import for robust WASM handling
import { CircuitResponse, GateResponse, RegisterResponse } from '@/api/dto/circuit';
import {GateDefinitionIdentifier} from "@/api/dto/GateDefinitionIdentifier.ts";

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
                gates: gates
            }
        ]
    }));

    return {
        id: "test-circuit",
        registers: registers
    };
};

/**
 * Helper to create a Gate object.
 */
const gate = (definitionId: string): GateResponse => ({
    id: `gate-${Math.random()}`,
    definitionId: definitionId as GateDefinitionIdentifier
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

    describe('Measurements', () => {
        it('should return null counts if no MEASURE gate is present', () => {
            const circuit = createCircuit([[gate('X')]]);
            const result = CircuitTranslator.translateAndRun(circuit);

            expect(result.counts).toBeNull();
        });

        it('should return counts if MEASURE gate is present', () => {
            const circuit = createCircuit([[gate('X'), gate('MEASURE')]]);
            const result = CircuitTranslator.translateAndRun(circuit);

            expect(result.counts).not.toBeNull();

            // Since state is |1>, we expect ~1024 counts for key '1'
            // We use string keys because that's how JS objects work
            const countForOne = result.counts ? result.counts['1'] : 0;

            expect(countForOne).toBe(1024);
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
});