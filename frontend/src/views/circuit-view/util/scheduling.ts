import { getInvolvedSelectors, getSelectorKey, LoopBlockDto } from '@/api/dto/circuit.ts';
import { isStrictlyInside, outermostBlocksCovering } from '@/lib/loopBlocks.ts';
import { doSpansOverlap, QubitSpan } from '@/views/circuit-view/util/spans.ts';
import { UiLayer, UiQuantumOperation } from '@/views/circuit-view/util/types.ts';

/** A frame's reserved area: the wires it spans, across the columns it occupies. */
type Reservation = { span: QubitSpan; firstColumn: number; lastColumn: number };

interface LayoutContext {
    /** Vertical reach of an operation, on the global wire index. */
    spanOf: (operation: UiQuantumOperation) => QubitSpan;
    /** Extra left bound for a single operation, used to pin the drag placeholder to the hover column. */
    minColumnFor?: (operation: UiQuantumOperation) => number;
}

/**
 * The state one layout pass carries while it fills columns.
 *
 * Grouped rather than threaded through as separate arguments: every step mutates the same four
 * structures plus the context, and passing them apart made the signatures say little beyond how
 * many there were.
 */
interface LayoutPass {
    columns: UiLayer[];
    /** Rightmost column each wire is occupied up to. */
    lastColumnPerQubit: Map<string, number>;
    /** Rectangles frames have claimed, which nothing outside them may enter. */
    reserved: Reservation[];
    /** Operations already laid out, so a frame's members are not placed twice. */
    placed: Set<string>;
    context: LayoutContext;
}

/**
 * ASAP (as-soon-as-possible) left-justified scheduling, giving every repetition frame a column range
 * of its own.
 *
 * <p>This is the frontend half of `QuantumCircuit.layOutColumns`; the two must stay in sync, because
 * the stored layers, the rendered columns and the `// Layer N` blocks of generated code are supposed
 * to be the same thing.
 *
 * A frame is placed as a unit rather than operation by operation. Left to the plain pass, an
 * unrelated gate slides into the first column a member happens to leave free on its own wire, and
 * then renders *inside* the drawn frame although it runs once — a picture that is wrong in a way
 * nobody would notice. The members' own layout is this same routine one level down, over the frames
 * strictly inside this one, which is what makes nesting work.
 *
 * @param operations flat list, pre-sorted into the order they should be considered
 * @param blocks the frames that apply at this level
 */
export const layOutColumns = (
    operations: UiQuantumOperation[],
    blocks: LoopBlockDto[],
    context: LayoutContext,
): UiLayer[] => {
    const pass: LayoutPass = {
        columns: [],
        lastColumnPerQubit: new Map<string, number>(),
        reserved: [],
        placed: new Set<string>(),
        context,
    };

    for (const operation of operations) {
        const id = operation.id;
        if (id && pass.placed.has(id)) continue;

        // Frames over the same operations share one rectangle, so any of them lays it out.
        const block = id ? outermostBlocksCovering(blocks, id)[0] : undefined;
        if (!block) {
            placeOperation(operation, pass);
            if (id) pass.placed.add(id);
        } else {
            placeBlock(block, blocks, operations, pass);
        }
    }

    return pass.columns.filter((column) => column.quantumOperations.length > 0);
};

/** Puts one operation in the leftmost column that is neither occupied nor inside a frame. */
const placeOperation = (operation: UiQuantumOperation, pass: LayoutPass): void => {
    const { columns, lastColumnPerQubit, reserved, context } = pass;
    const span = context.spanOf(operation);
    let columnIdx = Math.max(earliestColumn(operation, lastColumnPerQubit), context.minColumnFor?.(operation) ?? 0);

    while (isColumnBlocked(span, columnIdx, columns, context) || isReserved(span, columnIdx, reserved)) {
        columnIdx++;
    }

    addToColumn(columns, columnIdx, operation);
    markOccupied(operation, columnIdx, lastColumnPerQubit);
};

/**
 * Places a whole frame: lays its members out among themselves, slides that rectangle right until it
 * clears everything already placed, and reserves it against everything placed later.
 */
const placeBlock = (
    block: LoopBlockDto,
    blocks: LoopBlockDto[],
    operations: UiQuantumOperation[],
    pass: LayoutPass,
): void => {
    const { columns, lastColumnPerQubit, reserved, placed, context } = pass;
    const byId = new Map(operations.map((operation) => [operation.id, operation]));
    const members = block.operationIds
        .map((id) => byId.get(id))
        .filter((member): member is UiQuantumOperation => member !== undefined);
    if (members.length === 0) return;

    const localColumns = layOutColumns(
        members,
        blocks.filter((candidate) => isStrictlyInside(candidate, block)),
        { spanOf: context.spanOf },
    );
    const width = localColumns.length;
    const blockSpan = spanOver(members, context);

    let start = 0;
    for (const member of members) {
        start = Math.max(start, earliestColumn(member, lastColumnPerQubit));
    }
    while (!rectangleIsFree(blockSpan, start, width, columns, reserved, context)) {
        start++;
    }

    localColumns.forEach((localColumn, relative) => {
        for (const member of localColumn.quantumOperations) {
            addToColumn(columns, start + relative, member);
            markOccupied(member, start + relative, lastColumnPerQubit);
            if (member.id) placed.add(member.id);
        }
    });
    reserved.push({ span: blockSpan, firstColumn: start, lastColumn: start + width - 1 });
};

/** Leftmost column an operation could go by its qubits alone, ignoring collisions and frames. */
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

/** Whether the given span at the given column falls inside a frame it is not part of. */
const isReserved = (span: QubitSpan, columnIdx: number, reserved: Reservation[]): boolean =>
    reserved.some(
        (rectangle) =>
            doSpansOverlap(span, rectangle.span) &&
            columnIdx >= rectangle.firstColumn &&
            columnIdx <= rectangle.lastColumn,
    );

const rectangleIsFree = (
    span: QubitSpan,
    start: number,
    width: number,
    columns: UiLayer[],
    reserved: Reservation[],
    context: LayoutContext,
): boolean => {
    for (let columnIdx = start; columnIdx < start + width; columnIdx++) {
        if (isColumnBlocked(span, columnIdx, columns, context) || isReserved(span, columnIdx, reserved)) {
            return false;
        }
    }
    return true;
};

/** Topmost to bottommost wire reached by any of the given operations. */
const spanOver = (operations: UiQuantumOperation[], context: LayoutContext): QubitSpan => {
    const spans = operations.map((operation) => context.spanOf(operation));
    return {
        min: Math.min(...spans.map((span) => span.min)),
        max: Math.max(...spans.map((span) => span.max)),
    };
};
