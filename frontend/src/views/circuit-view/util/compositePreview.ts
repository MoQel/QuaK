import {
    CompositeQuantumGateDto,
    ElementSelectorDto,
    getInvolvedSelectors,
    getSelectorKey,
    QuantumOperationDto,
} from '@/api/dto/circuit.ts';
import { layOutColumns } from '@/views/circuit-view/util/scheduling.ts';
import { QubitSpan } from '@/views/circuit-view/util/spans.ts';

/**
 * Widest preview drawn. A hover panel that grows with the body would eventually cover the circuit it
 * is supposed to explain, so a long body is cut off after this many columns and the remainder is
 * only counted.
 */
export const MAX_PREVIEW_COLUMNS = 12;

/** One operation of the body, placed in the preview's own little grid. */
export interface PreviewOperation {
    operation: QuantumOperationDto;
    column: number;
    /** Rows — i.e. parameter positions — the operation targets, and the ones it controls. */
    targetRows: number[];
    controlRows: number[];
    minRow: number;
    maxRow: number;
}

/**
 * The body of a composite gate as its own miniature circuit.
 *
 * The rows are the gate's *parameters*, not the circuit's wires: the panel shows what the gate does,
 * which is a property of the definition and stays the same wherever the gate is called.
 */
export interface CompositePreview {
    /** One label per row, in parameter order. */
    portLabels: string[];
    columnCount: number;
    operations: PreviewOperation[];
    /** Operations dropped because the body is wider than {@link MAX_PREVIEW_COLUMNS}. */
    hiddenOperations: number;
}

/**
 * Lays the body out for the hover preview.
 *
 * The DTO's body arrives bound to the *call's* qubits, so a body selector is always one of the
 * call's `targetQubits` — and a call may not pass the same qubit twice, which makes that binding
 * invertible: a qubit's position in `targetQubits` is its parameter index. That inversion is what
 * turns the body back into something drawable on parameter rows, and it is the same one
 * `CompositeQuantumGate.fromBoundBody` uses on the backend.
 */
export const buildCompositePreview = (gate: CompositeQuantumGateDto): CompositePreview => {
    const rowOfQubit = new Map<string, number>();
    gate.targetQubits.forEach((selector, position) => rowOfQubit.set(getSelectorKey(selector), position));

    const portLabels = gate.targetQubits.map((_, position) => gate.portLabels?.[position] ?? `q${position}`);

    const rowsOf = (selectors: ElementSelectorDto[]): number[] | null => {
        const rows: number[] = [];
        for (const selector of selectors) {
            const row = rowOfQubit.get(getSelectorKey(selector));
            // Cannot happen for a well-formed body, and there is no honest place to draw it: a
            // foreign qubit is not one of the gate's parameters, so any row would be a lie.
            if (row === undefined) return null;
            rows.push(row);
        }
        return rows;
    };

    const drawable = (gate.body ?? []).filter(
        (operation) => operation.type !== 'DUMMY' && rowsOf(getInvolvedSelectors(operation)) !== null,
    );

    const spanOf = (operation: QuantumOperationDto): QubitSpan => {
        const rows = rowsOf(getInvolvedSelectors(operation)) ?? [0];
        return { min: Math.min(...rows), max: Math.max(...rows) };
    };

    // The same ASAP pass the circuit itself is laid out with, so the preview groups the body's
    // operations into columns exactly as ungrouping the gate would show them.
    const columns = layOutColumns(drawable.map((operation, index) => ({ ...operation, originalLayerIdx: index })), {
        spanOf,
    });

    const visible = columns.slice(0, MAX_PREVIEW_COLUMNS);
    const hiddenOperations = columns
        .slice(MAX_PREVIEW_COLUMNS)
        .reduce((count, column) => count + column.quantumOperations.length, 0);

    const operations = visible.flatMap((column, columnIdx) =>
        column.quantumOperations.map((operation) => {
            const targetRows = rowsOf(operation.targetQubits) ?? [];
            const controlRows = rowsOf(operation.controlQubits ?? []) ?? [];
            const span = spanOf(operation);

            return {
                operation,
                column: columnIdx,
                targetRows,
                controlRows,
                minRow: span.min,
                maxRow: span.max,
            };
        }),
    );

    return { portLabels, columnCount: visible.length, operations, hiddenOperations };
};
