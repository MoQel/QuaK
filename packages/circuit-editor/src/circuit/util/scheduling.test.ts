import { describe, expect, it } from 'vitest';
import { LoopBlockDto, RegisterResponse, getOperationSpan } from '@quak/circuit-core';
import { layOutColumns, withTerminalMeasurementsLast } from './scheduling.ts';
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

const measurement = (id: string, target: number, bit: number, originalLayerIdx = 0): UiQuantumOperation => ({
    id,
    type: 'MEASUREMENT',
    identifier: 'MEASURE',
    inverseForm: false,
    targetQubits: [qubit(target)],
    controlQubits: [],
    classicBits: [{ registerId: 'c1', index: bit }],
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

    it('does not let a measurement slide left past earlier gates', () => {
        // h q[0]; t q[0]; measure q[3] — wire 3 is idle from the start, so plain ASAP would put the
        // measurement in column 0, drawn as if it ran before the gates.
        const operations = [gate('h', 'H', [0]), gate('t', 'T', [0]), measurement('m', 3, 0)];

        expect(idsPerColumn(operations)).toEqual([['h'], ['t'], ['m']]);
    });

    it('gives every measurement a column of its own', () => {
        // Sharing one would draw their classical wires on top of each other, leaving a single
        // readable bit label for all of them.
        const operations = [
            gate('h', 'H', [0]),
            gate('t', 'T', [0]),
            measurement('m0', 0, 0),
            measurement('m1', 1, 1),
            measurement('m2', 2, 2),
        ];

        expect(idsPerColumn(operations)).toEqual([['h'], ['t'], ['m0'], ['m1'], ['m2']]);
    });

    it('still lets a gate pass a measurement that came before it', () => {
        // Only measurements are pinned; an independent gate stays free to left-justify.
        const operations = [gate('h', 'H', [0]), measurement('m', 0, 0), gate('x', 'X', [3])];

        expect(idsPerColumn(operations)).toEqual([['h', 'x'], ['m']]);
    });
});

describe('withTerminalMeasurementsLast', () => {
    it('heals an order a pre-fix layout left behind', () => {
        // Each measurement is stored in the column it had drifted into, interleaved with the gates.
        const operations = [
            gate('h', 'H', [0]),
            gate('cx01', 'CX', [1], [0]),
            measurement('m0', 0, 0),
            gate('cx12', 'CX', [2], [1]),
            measurement('m1', 1, 1),
            gate('cx23', 'CX', [3], [2]),
            measurement('m2', 2, 2),
            measurement('m3', 3, 3),
        ];

        expect(idsPerColumn(withTerminalMeasurementsLast(operations))).toEqual([
            ['h'],
            ['cx01'],
            ['cx12'],
            ['cx23'],
            ['m0'],
            ['m1'],
            ['m2'],
            ['m3'],
        ]);
    });

    it('leaves a real mid-circuit measurement where it is', () => {
        // Something still follows on wire 0, so this measurement is not terminal.
        const operations = [gate('h', 'H', [0]), measurement('m', 0, 0), gate('x', 'X', [0])];

        expect(withTerminalMeasurementsLast(operations).map((operation) => operation.id)).toEqual(['h', 'm', 'x']);
    });

    it('changes nothing when the measurements already come last', () => {
        const operations = [gate('h', 'H', [0]), measurement('m0', 0, 0), measurement('m1', 1, 1)];

        expect(withTerminalMeasurementsLast(operations).map((operation) => operation.id)).toEqual(['h', 'm0', 'm1']);
    });

    it('keeps only the last of two measurements on one wire at the back', () => {
        const operations = [measurement('early', 0, 0), gate('x', 'X', [0]), measurement('late', 0, 1)];

        expect(withTerminalMeasurementsLast(operations).map((operation) => operation.id)).toEqual([
            'early',
            'x',
            'late',
        ]);
    });
});
