import { describe, it, expect } from 'vitest';
import { formatRotationAngle, parseRotationAngle } from './angle.ts';

describe('formatRotationAngle', () => {
    it('formats zero and non-finite values as "0"', () => {
        expect(formatRotationAngle(0)).toBe('0');
        expect(formatRotationAngle(-0)).toBe('0');
        expect(formatRotationAngle(Number.NaN)).toBe('0');
        expect(formatRotationAngle(Number.POSITIVE_INFINITY)).toBe('0');
    });

    it('recognizes named constants (τ = 2π and e), checked before π-multiples', () => {
        expect(formatRotationAngle(2 * Math.PI)).toBe('τ');
        expect(formatRotationAngle(-2 * Math.PI)).toBe('-τ');
        expect(formatRotationAngle(Math.E)).toBe('e');
        expect(formatRotationAngle(-Math.E)).toBe('-e');
    });

    it('formats rational multiples of π', () => {
        expect(formatRotationAngle(Math.PI)).toBe('π');
        expect(formatRotationAngle(-Math.PI)).toBe('-π');
        expect(formatRotationAngle(Math.PI / 2)).toBe('π/2');
        expect(formatRotationAngle(-Math.PI / 4)).toBe('-π/4');
        expect(formatRotationAngle((3 * Math.PI) / 4)).toBe('3π/4');
        expect(formatRotationAngle((2 * Math.PI) / 3)).toBe('2π/3');
        expect(formatRotationAngle(3 * Math.PI)).toBe('3π');
    });

    it('falls back to an integer or a rounded 2-decimal number', () => {
        expect(formatRotationAngle(1)).toBe('1');
        expect(formatRotationAngle(1.5)).toBe('1.5');
        expect(formatRotationAngle(1.5708)).toBe('1.57'); // close to π/2 but not exact
        expect(formatRotationAngle(-0.123456)).toBe('-0.12');
    });
});

describe('parseRotationAngle', () => {
    it('reads plain numbers', () => {
        expect(parseRotationAngle('0')).toBe(0);
        expect(parseRotationAngle('1.5708')).toBeCloseTo(1.5708, 10);
        expect(parseRotationAngle('-0.5')).toBeCloseTo(-0.5, 10);
        expect(parseRotationAngle('  2  ')).toBe(2);
    });

    it('reads named constants, spelled out or as symbols', () => {
        expect(parseRotationAngle('pi')).toBeCloseTo(Math.PI, 10);
        expect(parseRotationAngle('π')).toBeCloseTo(Math.PI, 10);
        expect(parseRotationAngle('PI')).toBeCloseTo(Math.PI, 10);
        expect(parseRotationAngle('tau')).toBeCloseTo(2 * Math.PI, 10);
        expect(parseRotationAngle('τ')).toBeCloseTo(2 * Math.PI, 10);
        expect(parseRotationAngle('e')).toBeCloseTo(Math.E, 10);
    });

    it('reads multiples and fractions, with or without the asterisk', () => {
        expect(parseRotationAngle('pi/2')).toBeCloseTo(Math.PI / 2, 10);
        expect(parseRotationAngle('2pi')).toBeCloseTo(2 * Math.PI, 10);
        expect(parseRotationAngle('2*pi/3')).toBeCloseTo((2 * Math.PI) / 3, 10);
        expect(parseRotationAngle('-π/4')).toBeCloseTo(-Math.PI / 4, 10);
        expect(parseRotationAngle('3 π / 4')).toBeCloseTo((3 * Math.PI) / 4, 10);
        expect(parseRotationAngle('3/4')).toBeCloseTo(0.75, 10);
    });

    it('rejects anything that is not an angle', () => {
        expect(parseRotationAngle('')).toBeNull();
        expect(parseRotationAngle('   ')).toBeNull();
        expect(parseRotationAngle('abc')).toBeNull();
        expect(parseRotationAngle('pi/0')).toBeNull();
        expect(parseRotationAngle('pi + 1')).toBeNull();
        expect(parseRotationAngle('2pi3')).toBeNull();
        // A lone sign or divisor has no value in it; without the guard both would read as 0.
        expect(parseRotationAngle('-')).toBeNull();
        expect(parseRotationAngle('/2')).toBeNull();
    });

    /**
     * The pattern is split on the `/` and both halves are written so they can match only one way --
     * an ambiguous number or whitespace run is retried at every position when the rest fails.
     */
    it('handles whitespace runs and refuses a second divisor', () => {
        expect(parseRotationAngle('3   *   π   /   4')).toBeCloseTo((3 * Math.PI) / 4, 10);
        expect(parseRotationAngle('pi/2/3')).toBeNull();
        expect(parseRotationAngle('     pi     ')).toBeCloseTo(Math.PI, 10);
        expect(parseRotationAngle('.5')).toBeCloseTo(0.5, 10);
    });

    /**
     * The point of the parser: the box shows `π/2`, so that is what lands in the edit field and has
     * to come back as the very same angle. Without this a single edit would round the angle.
     */
    it('round-trips every shape the label can take', () => {
        const angles = [
            0,
            Math.PI,
            -Math.PI,
            Math.PI / 2,
            -Math.PI / 4,
            (3 * Math.PI) / 4,
            (2 * Math.PI) / 3,
            3 * Math.PI,
            2 * Math.PI,
            Math.E,
            1,
        ];

        for (const angle of angles) {
            expect(parseRotationAngle(formatRotationAngle(angle))).toBeCloseTo(angle, 10);
        }
    });
});
