import { describe, expect, it } from 'vitest';
import { RegisterResponse } from '@/api/dto/circuit.ts';
import { UiLayer, UiQuantumOperation } from '@/views/circuit-view/util/types.ts';
import { operationsInRect, rectBetween } from './selection.ts';

const registers: RegisterResponse[] = [{ id: 'r1', name: 'q', type: 'Quantum_Register', numberOfQubits: 4 }];

const gate = (id: string, targets: number[], controls: number[] = []): UiQuantumOperation => ({
    id,
    type: 'ELEMENTARY_QUANTUM_GATE',
    identifier: 'H',
    inverseForm: false,
    targetQubits: targets.map((index) => ({ registerId: 'r1', index })),
    controlQubits: controls.map((index) => ({ registerId: 'r1', index })),
    rotationAngle: 0,
    originalLayerIdx: 0,
});

const layersOf = (...columns: UiQuantumOperation[][]): UiLayer[] =>
    columns.map((quantumOperations) => ({ quantumOperations }));

const idsIn = (layers: UiLayer[], rect: Parameters<typeof operationsInRect>[2]) =>
    operationsInRect(layers, registers, rect).map((operation) => operation.id);

describe('rectBetween', () => {
    it('normalises a drag in any direction', () => {
        const downRight = rectBetween({ column: 1, wire: 0 }, { column: 3, wire: 2 });
        const upLeft = rectBetween({ column: 3, wire: 2 }, { column: 1, wire: 0 });

        expect(downRight).toEqual({ firstColumn: 1, lastColumn: 3, topWire: 0, bottomWire: 2 });
        expect(upLeft).toEqual(downRight);
    });

    it('keeps a single cell as a rectangle of one', () => {
        expect(rectBetween({ column: 2, wire: 1 }, { column: 2, wire: 1 })).toEqual({
            firstColumn: 2,
            lastColumn: 2,
            topWire: 1,
            bottomWire: 1,
        });
    });
});

describe('operationsInRect', () => {
    it('takes what lies inside and leaves the rest', () => {
        const layers = layersOf([gate('a', [0])], [gate('b', [1])], [gate('c', [3])]);

        expect(idsIn(layers, { firstColumn: 0, lastColumn: 1, topWire: 0, bottomWire: 1 })).toEqual(['a', 'b']);
    });

    /**
     * The rule that keeps the drawn box and the resulting frame the same: a gate reaching past the
     * rectangle would pull the frame's bounding box down to its far wire.
     */
    it('leaves out a gate that reaches past the rectangle', () => {
        const layers = layersOf([gate('wide', [3], [0])]);

        expect(idsIn(layers, { firstColumn: 0, lastColumn: 0, topWire: 0, bottomWire: 1 })).toEqual([]);
        expect(idsIn(layers, { firstColumn: 0, lastColumn: 0, topWire: 0, bottomWire: 3 })).toEqual(['wide']);
    });

    it('returns program order: column by column, topmost wire first', () => {
        const layers = layersOf([gate('lower', [2]), gate('upper', [0])], [gate('later', [1])]);

        expect(idsIn(layers, { firstColumn: 0, lastColumn: 1, topWire: 0, bottomWire: 3 })).toEqual([
            'upper',
            'lower',
            'later',
        ]);
    });

    it('ignores the drag placeholder', () => {
        const dummy: UiQuantumOperation = { ...gate('dummy', [0]), type: 'DUMMY' };
        const layers = layersOf([dummy, gate('real', [1])]);

        expect(idsIn(layers, { firstColumn: 0, lastColumn: 0, topWire: 0, bottomWire: 3 })).toEqual(['real']);
    });

    it('finds nothing in an empty area', () => {
        const layers = layersOf([gate('a', [0])]);

        expect(idsIn(layers, { firstColumn: 2, lastColumn: 4, topWire: 0, bottomWire: 3 })).toEqual([]);
    });
});
