import { describe, expect, it, vi } from 'vitest';
import { CircuitResponse, ElementaryQuantumGateDto } from '@/api/dto/circuit.ts';
import { toCircuitContentPayload } from './circuitPersistence.ts';

vi.mock('@/api/api.ts', () => ({ api: { put: vi.fn(), post: vi.fn() } }));

const gate = (id: string): ElementaryQuantumGateDto => ({
    id,
    type: 'ELEMENTARY_QUANTUM_GATE',
    identifier: 'H',
    inverseForm: false,
    targetQubits: [{ registerId: 'r1', index: 0 }],
    controlQubits: [],
    rotationAngle: 0,
});

const circuit = (overrides: Partial<CircuitResponse> = {}): CircuitResponse => ({
    id: 'c1',
    registers: [{ id: 'r1', name: 'q', type: 'Quantum_Register', numberOfQubits: 2 }],
    layers: [{ quantumOperations: [gate('a')] }],
    ...overrides,
});

describe('toCircuitContentPayload', () => {
    /** PUT is full-replace, so a frame that is not sent is a frame that is deleted. */
    it('sends the repetition frames along', () => {
        const payload = toCircuitContentPayload(
            circuit({ loopBlocks: [{ id: 'loop', repeatCount: 3, operationIds: ['a'] }] }),
        );

        expect(payload.loopBlocks).toEqual([{ id: 'loop', repeatCount: 3, operationIds: ['a'] }]);
    });

    it('sends an empty list when there are none', () => {
        expect(toCircuitContentPayload(circuit()).loopBlocks).toEqual([]);
    });

    /**
     * Deleting a gate says nothing about the frames that covered it, and the backend rejects a frame
     * naming an operation the payload does not contain — which would make the circuit unsavable.
     */
    it('drops members whose operation was deleted', () => {
        const payload = toCircuitContentPayload(
            circuit({ loopBlocks: [{ id: 'loop', repeatCount: 3, operationIds: ['a', 'deleted'] }] }),
        );

        expect(payload.loopBlocks).toEqual([{ id: 'loop', repeatCount: 3, operationIds: ['a'] }]);
    });

    it('drops a frame that lost every member', () => {
        const payload = toCircuitContentPayload(
            circuit({ loopBlocks: [{ id: 'loop', repeatCount: 3, operationIds: ['deleted'] }] }),
        );

        expect(payload.loopBlocks).toEqual([]);
    });
});
