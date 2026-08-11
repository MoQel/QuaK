import { describe, expect, it } from 'vitest';
import { LoopBlockDto } from '@/api/dto/circuit.ts';
import { LoopFrame } from '@/views/circuit-view/util/loopFrames.ts';
import { detachFromLoops, framesAround, rebindMembership } from './loopMembership.ts';

/** A frame covering columns 1–2 on wires 0–1. */
const frame = (id: string, overrides: Partial<LoopFrame> = {}): LoopFrame => ({
    id,
    repeatCount: 2,
    firstColumn: 1,
    lastColumn: 2,
    topWire: 0,
    bottomWire: 1,
    depth: 0,
    ...overrides,
});

const block = (id: string, operationIds: string[]): LoopBlockDto => ({ id, repeatCount: 2, operationIds });

const span = (min: number, max = min) => ({ min, max });

describe('framesAround', () => {
    const frames = [frame('f1')];

    it('finds the frame a position sits in', () => {
        expect(framesAround(frames, 1, span(0)).map((f) => f.id)).toEqual(['f1']);
        expect(framesAround(frames, 2, span(1)).map((f) => f.id)).toEqual(['f1']);
    });

    it('finds nothing outside the rectangle', () => {
        expect(framesAround(frames, 0, span(0))).toEqual([]); // left of it
        expect(framesAround(frames, 3, span(0))).toEqual([]); // right of it
        expect(framesAround(frames, 1, span(2))).toEqual([]); // below it
    });

    /** Half in, half out would drag the frame open; the same rule the selection uses. */
    it('leaves out an operation that reaches past the frame', () => {
        expect(framesAround(frames, 1, span(1, 3))).toEqual([]);
    });

    it('reports every frame around a position, innermost and outermost alike', () => {
        const nested = [frame('outer', { firstColumn: 0, lastColumn: 3 }), frame('inner')];

        expect(framesAround(nested, 1, span(0)).map((f) => f.id)).toEqual(['outer', 'inner']);
    });
});

describe('rebindMembership', () => {
    const frames = [frame('f1')];

    it('drops a member that was moved out of the frame', () => {
        const result = rebindMembership([block('f1', ['a', 'b'])], frames, 'a', 5, span(0));

        expect(result[0].operationIds).toEqual(['b']);
    });

    it('adds an outsider that was moved into the frame', () => {
        const result = rebindMembership([block('f1', ['a'])], frames, 'newcomer', 1, span(0));

        expect(result[0].operationIds).toEqual(['a', 'newcomer']);
    });

    it('leaves membership alone when a member moves within the frame', () => {
        const blocks = [block('f1', ['a', 'b'])];
        const result = rebindMembership(blocks, frames, 'a', 2, span(1));

        expect(result[0]).toBe(blocks[0]);
    });

    it('leaves an outsider outside when it moves elsewhere outside', () => {
        const blocks = [block('f1', ['a'])];

        expect(rebindMembership(blocks, frames, 'stranger', 7, span(2))[0]).toBe(blocks[0]);
    });

    /** A frame with nothing left in it is no frame; the backend rejects an empty one outright. */
    it('drops a frame whose last member left', () => {
        expect(rebindMembership([block('f1', ['only'])], frames, 'only', 9, span(3))).toEqual([]);
    });

    it('joins every frame around the drop, so nesting is kept', () => {
        const nested = [frame('outer', { firstColumn: 0, lastColumn: 3 }), frame('inner')];
        const blocks = [block('outer', ['a']), block('inner', ['a'])];

        const result = rebindMembership(blocks, nested, 'b', 1, span(0));

        expect(result.map((b) => b.operationIds)).toEqual([
            ['a', 'b'],
            ['a', 'b'],
        ]);
    });
});

describe('detachFromLoops', () => {
    it('removes a deleted operation from every frame', () => {
        const result = detachFromLoops([block('f1', ['a', 'gone']), block('f2', ['gone', 'b'])], 'gone');

        expect(result.map((b) => b.operationIds)).toEqual([['a'], ['b']]);
    });

    it('drops a frame that is left empty', () => {
        expect(detachFromLoops([block('f1', ['gone'])], 'gone')).toEqual([]);
    });

    it('leaves frames without that operation untouched', () => {
        const blocks = [block('f1', ['a'])];

        expect(detachFromLoops(blocks, 'other')[0]).toBe(blocks[0]);
    });
});
