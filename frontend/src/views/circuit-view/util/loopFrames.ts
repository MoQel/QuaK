import { LoopBlockDto, QuantumOperationDto, RegisterResponse } from '@/api/dto/circuit.ts';
import { isStrictlyInside } from '@/lib/loopBlocks.ts';
import { getOperationSpan } from '@/views/circuit-view/util/spans.ts';

/**
 * A column of the rendered circuit. Structural on purpose: the editor passes its scheduled
 * `UiLayer`s, the LaTeX export passes the circuit's stored layers, and both are the same shape.
 */
type ColumnOfOperations = { quantumOperations: QuantumOperationDto[] };

/** A repetition frame reduced to what it takes to draw it. */
export interface LoopFrame {
    id: string;
    repeatCount: number;
    firstColumn: number;
    lastColumn: number;
    topWire: number;
    bottomWire: number;
    /** How many frames enclose this one, so nested borders can be drawn inside each other. */
    depth: number;
}

/**
 * Derives the drawable frames from where their members currently sit.
 *
 * Nothing about the rectangle is stored — a frame knows only which operations it covers, and the
 * box is the bounding area of those. That is the whole reason a frame survives editing: ASAP
 * scheduling moves the operations around constantly, and a remembered column range would be wrong
 * after the first change while a derived one simply follows.
 *
 * A frame whose members are no longer in the circuit yields nothing, so a deleted gate cannot leave
 * a box hanging in the air.
 */
export const getLoopFrames = (
    uiLayers: ColumnOfOperations[],
    loopBlocks: LoopBlockDto[],
    registers: RegisterResponse[],
): LoopFrame[] =>
    loopBlocks
        .map((block) => toFrame(block, uiLayers, loopBlocks, registers))
        .filter((frame): frame is LoopFrame => frame !== null);

/**
 * How many frames enclose this one. Frames covering exactly the same operations do not contain each
 * other, but they are still one inside the other — they get consecutive depths by their order so the
 * boxes are drawn nested instead of exactly on top of one another.
 */
const nestingDepth = (block: LoopBlockDto, loopBlocks: LoopBlockDto[]): number => {
    const enclosing = loopBlocks.filter((candidate) => isStrictlyInside(block, candidate)).length;
    const sameArea = loopBlocks.filter(
        (candidate) =>
            candidate.operationIds.length === block.operationIds.length &&
            candidate.operationIds.every((id) => block.operationIds.includes(id)),
    );
    return enclosing + sameArea.indexOf(block);
};

const toFrame = (
    block: LoopBlockDto,
    uiLayers: ColumnOfOperations[],
    loopBlocks: LoopBlockDto[],
    registers: RegisterResponse[],
): LoopFrame | null => {
    const members = block.operationIds;
    let firstColumn = Number.POSITIVE_INFINITY;
    let lastColumn = Number.NEGATIVE_INFINITY;
    let topWire = Number.POSITIVE_INFINITY;
    let bottomWire = Number.NEGATIVE_INFINITY;

    uiLayers.forEach((layer, columnIdx) => {
        for (const operation of layer.quantumOperations) {
            if (!operation.id || !members.includes(operation.id)) continue;

            const span = getOperationSpan(registers, operation);
            firstColumn = Math.min(firstColumn, columnIdx);
            lastColumn = Math.max(lastColumn, columnIdx);
            topWire = Math.min(topWire, span.min);
            bottomWire = Math.max(bottomWire, span.max);
        }
    });

    if (!Number.isFinite(firstColumn)) return null;

    return {
        id: block.id,
        repeatCount: block.repeatCount,
        firstColumn,
        lastColumn,
        topWire,
        bottomWire,
        depth: nestingDepth(block, loopBlocks),
    };
};
