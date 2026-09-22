import { LoopBlockDto } from '@/api/dto/circuit.ts';
import { LoopFrame } from '@/views/circuit-view/util/loopFrames.ts';
import { QubitSpan } from '@/views/circuit-view/util/spans.ts';

/**
 * Which frames enclose a given position.
 *
 * "Enclose" means the operation fits *entirely* inside the drawn rectangle — the same rule the
 * selection uses. A gate half in and half out would otherwise stretch the frame to reach it, so the
 * box would move on its own the moment something was dropped near its edge.
 */
export const framesAround = (frames: LoopFrame[], column: number, span: QubitSpan): LoopFrame[] =>
    frames.filter(
        (frame) =>
            column >= frame.firstColumn &&
            column <= frame.lastColumn &&
            span.min >= frame.topWire &&
            span.max <= frame.bottomWire,
    );

/**
 * Re-decides which loops an operation belongs to, from where it was just dropped.
 *
 * Membership is a list of ids, so without this a gate stayed in its loop wherever it was dragged and
 * the frame simply grew to follow it — there was no way to take a gate *out* of a loop, and none to
 * put one *in*. Deriving it from the drop position instead makes all three gestures fall out of one
 * rule: dropped inside the box it joins, outside it leaves, and moving within the box changes
 * nothing.
 *
 * The frames are the ones drawn while dragging, i.e. computed without the dragged operation — so the
 * box the user is aiming at is exactly the box being decided against.
 *
 * @param frames the rectangles as currently rendered
 * @param column the column the operation lands in
 * @param span the wires it will cover there
 */
export const rebindMembership = (
    loopBlocks: LoopBlockDto[],
    frames: LoopFrame[],
    operationId: string,
    column: number,
    span: QubitSpan,
): LoopBlockDto[] => {
    const joining = new Set(framesAround(frames, column, span).map((frame) => frame.id));

    return loopBlocks
        .map((block) => {
            const wasMember = block.operationIds.includes(operationId);
            const isMember = joining.has(block.id);
            if (wasMember === isMember) return block;

            return {
                ...block,
                // Appended rather than inserted: a frame's own order only decides which member the
                // generated `for` is written at, and the layers give that away anyway.
                operationIds: isMember
                    ? [...block.operationIds, operationId]
                    : block.operationIds.filter((id) => id !== operationId),
            };
        })
        .filter((block) => block.operationIds.length > 0);
};

/**
 * Takes an operation out of every frame — for when it leaves the circuit altogether.
 *
 * A frame naming an operation the circuit no longer has is rejected by the backend on save, so
 * deleting a gate inside a loop has to clean up after itself or the next autosave fails.
 */
export const detachFromLoops = (loopBlocks: LoopBlockDto[], operationId: string): LoopBlockDto[] =>
    loopBlocks
        .map((block) =>
            block.operationIds.includes(operationId)
                ? { ...block, operationIds: block.operationIds.filter((id) => id !== operationId) }
                : block,
        )
        .filter((block) => block.operationIds.length > 0);
