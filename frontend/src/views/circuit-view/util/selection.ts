import { RegisterResponse } from '@/api/dto/circuit.ts';
import { getOperationSpan } from '@/views/circuit-view/util/spans.ts';
import { UiLayer, UiQuantumOperation } from '@/views/circuit-view/util/types.ts';

/** A cell of the circuit grid: one column on one wire. */
export interface Cell {
    column: number;
    wire: number;
}

/** A rectangle of cells, normalised so first/top are never past last/bottom. */
export interface CellRect {
    firstColumn: number;
    lastColumn: number;
    topWire: number;
    bottomWire: number;
}

/** The rectangle spanned by a drag from one cell to another, in either direction. */
export const rectBetween = (from: Cell, to: Cell): CellRect => ({
    firstColumn: Math.min(from.column, to.column),
    lastColumn: Math.max(from.column, to.column),
    topWire: Math.min(from.wire, to.wire),
    bottomWire: Math.max(from.wire, to.wire),
});

/**
 * The operations lying entirely inside the rectangle, in program order.
 *
 * "Entirely" is what makes the selection predictable: a gate reaching past the rectangle — a `cx`
 * from q[0] to q[3] when only q[0] and q[1] were covered — stays out rather than silently dragging
 * the frame down to its far wire. The frame is the bounding box of its members, so taking only
 * what fits means the box that appears is the box that was drawn.
 *
 * Program order is column by column and, within a column, top wire first — the same order the code
 * generator writes a layer in, so the `for` body it emits reads the way the circuit looks.
 */
export const operationsInRect = (
    uiLayers: UiLayer[],
    registers: RegisterResponse[],
    rect: CellRect,
): UiQuantumOperation[] => {
    const selected: UiQuantumOperation[] = [];

    uiLayers.forEach((layer, columnIdx) => {
        if (columnIdx < rect.firstColumn || columnIdx > rect.lastColumn) return;

        const inColumn = layer.quantumOperations
            .filter((operation) => operation.type !== 'DUMMY')
            .map((operation) => ({ operation, span: getOperationSpan(registers, operation) }))
            .filter(({ span }) => span.min >= rect.topWire && span.max <= rect.bottomWire)
            .sort((a, b) => a.span.min - b.span.min)
            .map(({ operation }) => operation);

        selected.push(...inColumn);
    });

    return selected;
};
