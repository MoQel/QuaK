/**
 * The wire a dragged operation would be anchored at, given the wire the pointer is over.
 *
 * An operation is positioned by its topmost wire, which makes two things go wrong if taken
 * literally:
 *
 * - Putting the anchor straight under the pointer shoves the operation down by however far down it
 *   was grabbed, so grabbing a four-wire box at its bottom edge means dragging three wires further
 *   up just to leave it where it was. `grabOffset` cancels that out, keeping the box under the point
 *   it is held by.
 * - The anchor may not sit so low that the operation would hang off the bottom, so it is clamped —
 *   which is also what lets every wire the operation covers act as a drop target instead of only its
 *   top row.
 */
export const dropAnchorRow = (
    hoveredRow: number,
    grabOffset: number,
    operationSize: number,
    totalWires: number,
): number => Math.min(Math.max(hoveredRow - grabOffset, 0), Math.max(totalWires - operationSize, 0));
