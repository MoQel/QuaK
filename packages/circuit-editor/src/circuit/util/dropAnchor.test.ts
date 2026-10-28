import { describe, expect, it } from 'vitest';
import { dropAnchorRow } from './dropAnchor.ts';

describe('dropAnchorRow', () => {
    /** A single-qubit gate is anchored exactly where the pointer is. */
    it('follows the pointer for a one-wire gate', () => {
        expect(dropAnchorRow(0, 0, 1, 4)).toBe(0);
        expect(dropAnchorRow(3, 0, 1, 4)).toBe(3);
    });

    /**
     * The reported annoyance: grabbing a tall gate low and dropping it on the same wire used to push
     * it down by the grab distance, so it had to be dragged that far up again.
     */
    it('keeps a gate where it was when it is grabbed at its bottom and not moved', () => {
        // 4-wire box on wires 0..3, grabbed at its bottom wire (offset 3), pointer still on wire 3.
        expect(dropAnchorRow(3, 3, 4, 6)).toBe(0);
    });

    it('moves a gate by exactly the distance the pointer moved', () => {
        // Same box, grabbed at its bottom, pointer moved one wire down.
        expect(dropAnchorRow(4, 3, 4, 6)).toBe(1);
    });

    /** Every wire the gate covers is a valid target: they all resolve to the same anchor. */
    it('maps all covered wires to one anchor when the gate reaches the bottom', () => {
        // 4-wire gate in a 4-wire circuit, grabbed at its top: only anchor 0 is possible.
        expect([0, 1, 2, 3].map((row) => dropAnchorRow(row, 0, 4, 4))).toEqual([0, 0, 0, 0]);
    });

    it('never lets the gate hang off the bottom', () => {
        // 2-wire gate in a 4-wire circuit: the lowest anchor is 2.
        expect(dropAnchorRow(3, 0, 2, 4)).toBe(2);
    });

    it('never lets the gate rise above the first wire', () => {
        expect(dropAnchorRow(0, 2, 3, 6)).toBe(0);
    });

    /** A gate wider than the circuit cannot be placed anywhere but the top. */
    it('clamps to zero when the gate is taller than the circuit', () => {
        expect(dropAnchorRow(2, 0, 6, 4)).toBe(0);
    });
});
