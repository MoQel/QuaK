import { getInvolvedSelectors, getSelectorKey } from '@/api/dto/circuit.ts';
import { doSpansOverlap, QubitSpan } from '@/views/circuit-view/util/spans.ts';
import { UiLayer, UiQuantumOperation } from '@/views/circuit-view/util/types.ts';

interface LayoutContext {
    /** Vertical reach of an operation, on the global wire index. */
    spanOf: (operation: UiQuantumOperation) => QubitSpan;
    /** Extra left bound for a single operation, used to pin the drag placeholder to the hover column. */
    minColumnFor?: (operation: UiQuantumOperation) => number;
}

/**
 * ASAP (as-soon-as-possible) left-justified scheduling of operations into columns.
 *
 * <p>This is the frontend half of `QuantumCircuit.layOutColumns`; the two must stay in sync, because
 * the stored layers, the rendered columns and the `// Layer N` blocks of generated code are supposed
 * to be the same thing.
 *
 * <p>Collision is span overlap, not merely a shared qubit: two operations may share a column only if
 * their vertical reaches are disjoint, so `cx q[0],q[2]` and `cx q[1],q[3]` land in separate columns.
 *
 * @param operations flat list, pre-sorted into the order they should be considered
 */
export const layOutColumns = (operations: UiQuantumOperation[], context: LayoutContext): UiLayer[] => {
    const columns: UiLayer[] = [];
    const lastColumnPerQubit = new Map<string, number>();

    for (const operation of operations) {
        placeOperation(operation, columns, lastColumnPerQubit, context);
    }

    return columns.filter((column) => column.quantumOperations.length > 0);
};

/** Puts one operation in the leftmost column nothing else in its span occupies. */
const placeOperation = (
    operation: UiQuantumOperation,
    columns: UiLayer[],
    lastColumnPerQubit: Map<string, number>,
    context: LayoutContext,
): void => {
    const span = context.spanOf(operation);
    let columnIdx = Math.max(earliestColumn(operation, lastColumnPerQubit), context.minColumnFor?.(operation) ?? 0);

    while (isColumnBlocked(span, columnIdx, columns, context)) {
        columnIdx++;
    }

    addToColumn(columns, columnIdx, operation);
    markOccupied(operation, columnIdx, lastColumnPerQubit);
};

const earliestColumn = (operation: UiQuantumOperation, lastColumnPerQubit: Map<string, number>): number => {
    let columnIdx = 0;
    for (const selector of getInvolvedSelectors(operation)) {
        columnIdx = Math.max(columnIdx, lastColumnPerQubit.get(getSelectorKey(selector)) ?? -1);
    }
    return columnIdx;
};

const markOccupied = (
    operation: UiQuantumOperation,
    columnIdx: number,
    lastColumnPerQubit: Map<string, number>,
): void => {
    for (const selector of getInvolvedSelectors(operation)) {
        lastColumnPerQubit.set(getSelectorKey(selector), columnIdx);
    }
};

const addToColumn = (columns: UiLayer[], columnIdx: number, operation: UiQuantumOperation): void => {
    while (columns.length <= columnIdx) {
        columns.push({ quantumOperations: [] });
    }
    columns[columnIdx].quantumOperations.push(operation);
};

/** Whether something already in this column reaches into the given span. */
const isColumnBlocked = (span: QubitSpan, columnIdx: number, columns: UiLayer[], context: LayoutContext): boolean =>
    columnIdx < columns.length &&
    columns[columnIdx].quantumOperations.some((existing) => doSpansOverlap(span, context.spanOf(existing)));
