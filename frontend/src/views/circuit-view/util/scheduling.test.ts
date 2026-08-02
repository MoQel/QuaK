import { describe, expect, it } from 'vitest';
import { LoopBlockDto, RegisterResponse } from '@/api/dto/circuit.ts';
import { getOperationSpan } from './spans.ts';
import { layOutColumns } from './scheduling.ts';
import { UiQuantumOperation } from './types.ts';

const registers: RegisterResponse[] = [{ id: 'r1', name: 'q', type: 'Quantum_Register', numberOfQubits: 4 }];

const qubit = (index: number) => ({ registerId: 'r1', index });

const gate = (
    id: string,
    identifier: string,
    targets: number[],
    controls: number[] = [],
    originalLayerIdx = 0,
): UiQuantumOperation => ({
    id,
    type: 'ELEMENTARY_QUANTUM_GATE',
    identifier,
    inverseForm: false,
    targetQubits: targets.map(qubit),
    controlQubits: controls.map(qubit),
    rotationAngle: 0,
    originalLayerIdx,
});

const layOut = (operations: UiQuantumOperation[], blocks: LoopBlockDto[] = []) =>
    layOutColumns(operations, blocks, { spanOf: (op) => getOperationSpan(registers, op) });

const idsPerColumn = (operations: UiQuantumOperation[], blocks: LoopBlockDto[] = []) =>
    layOut(operations, blocks).map((column) => column.quantumOperations.map((op) => op.id));

describe('layOutColumns', () => {
    it('left-justifies as before when there is no frame', () => {
        // h q[0]; h q[0]; h q[3] → the two on wire 0 stack, the one on wire 3 rides along in column 0.
        const operations = [gate('a', 'H', [0]), gate('b', 'H', [0]), gate('c', 'H', [3])];

        expect(idsPerColumn(operations)).toEqual([['a', 'c'], ['b']]);
    });

    it('keeps spans apart, not just shared qubits', () => {
        // cx q[0],q[2] and cx q[1],q[3] cross each other, so they cannot share a column.
        const operations = [gate('a', 'CX', [2], [0]), gate('b', 'CX', [3], [1])];

        expect(idsPerColumn(operations)).toEqual([['a'], ['b']]);
    });

    /**
     * The column a member leaves free on its own wire must not be usable by an outsider — otherwise
     * it renders inside the frame while running once.
     */
    it('pushes an outsider out of a frame', () => {
        const operations = [
            gate('outsider', 'X', [0]),
            gate('m1', 'CX', [1], [2]),
            gate('m2', 'CX', [0], [2]),
            gate('m3', 'CCX', [2], [0, 1]),
        ];
        const blocks: LoopBlockDto[] = [{ id: 'loop', repeatCount: 3, operationIds: ['m1', 'm2', 'm3'] }];

        // Without the reservation the X would sit next to m1 in column 0, inside a frame spanning wires 0..2.
        expect(idsPerColumn(operations, blocks)).toEqual([['outsider'], ['m1'], ['m2'], ['m3']]);
    });

    it('lets a gate outside the frame’s wires keep its column', () => {
        const operations = [
            gate('beside', 'H', [3]),
            gate('m1', 'CX', [1], [2]),
            gate('m2', 'CX', [0], [2]),
            gate('m3', 'CCX', [2], [0, 1]),
        ];
        const blocks: LoopBlockDto[] = [{ id: 'loop', repeatCount: 3, operationIds: ['m1', 'm2', 'm3'] }];

        expect(idsPerColumn(operations, blocks)[0]).toEqual(['beside', 'm1']);
    });

    it('keeps a later gate behind the frame', () => {
        const operations = [
            gate('m1', 'CX', [1], [2]),
            gate('m2', 'CX', [0], [2]),
            gate('m3', 'CCX', [2], [0, 1]),
            gate('after', 'X', [0], [], 3),
        ];
        const blocks: LoopBlockDto[] = [{ id: 'loop', repeatCount: 3, operationIds: ['m1', 'm2', 'm3'] }];

        expect(idsPerColumn(operations, blocks)).toEqual([['m1'], ['m2'], ['m3'], ['after']]);
    });

    /**
     * A frame is placed as a unit, so a non-member that sorts between two members cannot split it —
     * which is what would otherwise leave a hole in the middle of the drawn box.
     */
    it('keeps a frame contiguous when an outsider sorts between its members', () => {
        const operations = [
            gate('m1', 'H', [0]),
            gate('outsider', 'X', [1], [], 1),
            gate('m2', 'CX', [1], [0], 2), // spans wires 0..1, so the frame covers both wires
        ];
        const blocks: LoopBlockDto[] = [{ id: 'loop', repeatCount: 2, operationIds: ['m1', 'm2'] }];

        expect(idsPerColumn(operations, blocks)).toEqual([['m1'], ['m2'], ['outsider']]);
    });

    it('drops a frame whose members are gone instead of throwing', () => {
        const operations = [gate('a', 'H', [0])];
        const blocks: LoopBlockDto[] = [{ id: 'loop', repeatCount: 2, operationIds: ['deleted'] }];

        expect(idsPerColumn(operations, blocks)).toEqual([['a']]);
    });
});
