import { describe, expect, it } from 'vitest';
import { CircuitResponse, ElementaryQuantumGateDto, LoopBlockDto } from '@/api/dto/circuit.ts';
import { toExecutionOrder } from './loopBlocks.ts';

const gate = (id: string, identifier: string, qubitIdx = 0): ElementaryQuantumGateDto => ({
    id,
    type: 'ELEMENTARY_QUANTUM_GATE',
    identifier,
    inverseForm: false,
    targetQubits: [{ registerId: 'r1', index: qubitIdx }],
    controlQubits: [],
    rotationAngle: 0,
});

const circuitOf = (layers: ElementaryQuantumGateDto[][], loopBlocks: LoopBlockDto[] = []): CircuitResponse => ({
    id: 'c1',
    registers: [{ id: 'r1', name: 'q', type: 'Quantum_Register', numberOfQubits: 4 }],
    layers: layers.map((quantumOperations) => ({ quantumOperations })),
    loopBlocks,
});

const identifiers = (circuit: CircuitResponse) => toExecutionOrder(circuit).map((op) => op.identifier);

describe('toExecutionOrder', () => {
    it('reads the layers left to right when there is no frame', () => {
        const circuit = circuitOf([[gate('a', 'H')], [gate('b', 'X')]]);

        expect(identifiers(circuit)).toEqual(['H', 'X']);
    });

    it('repeats a framed body, in place', () => {
        const circuit = circuitOf(
            [[gate('a', 'H')], [gate('b', 'X')], [gate('c', 'Z')]],
            [{ id: 'loop', repeatCount: 3, operationIds: ['a', 'b'] }],
        );

        // H,X three times — and the Z that follows the loop still comes last.
        expect(identifiers(circuit)).toEqual(['H', 'X', 'H', 'X', 'H', 'X', 'Z']);
    });

    it('keeps operations before the frame in front of it', () => {
        const circuit = circuitOf(
            [[gate('a', 'Y')], [gate('b', 'H')]],
            [{ id: 'loop', repeatCount: 2, operationIds: ['b'] }],
        );

        expect(identifiers(circuit)).toEqual(['Y', 'H', 'H']);
    });

    /** The inner loop runs its body 3 times, and the outer repeats all of that twice: 6 in total. */
    it('multiplies nested frames', () => {
        const circuit = circuitOf(
            [[gate('a', 'H')], [gate('b', 'X')]],
            [
                { id: 'inner', repeatCount: 3, operationIds: ['b'] },
                { id: 'outer', repeatCount: 2, operationIds: ['a', 'b'] },
            ],
        );

        expect(identifiers(circuit)).toEqual(['H', 'X', 'X', 'X', 'H', 'X', 'X', 'X']);
    });

    /**
     * `for i in [0:1] { for j in [0:2] { h q[0]; } }` collapses to one H carrying a ×2 and a ×3
     * frame over exactly the same operation. Member sets cannot say which is the inner one — and
     * they need not, since the body runs 2·3 times either way. Picking one would drop a factor.
     */
    it('multiplies frames that cover exactly the same operations', () => {
        const circuit = circuitOf(
            [[gate('a', 'H')]],
            [
                { id: 'inner', repeatCount: 3, operationIds: ['a'] },
                { id: 'outer', repeatCount: 2, operationIds: ['a'] },
            ],
        );

        expect(identifiers(circuit)).toHaveLength(6);
    });

    it('ignores a frame whose members are gone', () => {
        const circuit = circuitOf([[gate('a', 'H')]], [{ id: 'loop', repeatCount: 5, operationIds: ['deleted'] }]);

        expect(identifiers(circuit)).toEqual(['H']);
    });

    it('skips the drag placeholder', () => {
        const circuit = circuitOf([[gate('a', 'H')], [{ ...gate('dummy', 'DUMMY'), type: 'DUMMY' } as never]]);

        expect(identifiers(circuit)).toEqual(['H']);
    });
});
