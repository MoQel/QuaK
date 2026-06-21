import { describe, it, expect } from 'vitest';
import { formatRotationAngle } from './angle.ts';

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

    it('falls back to an integer or a 2-decimal number', () => {
        expect(formatRotationAngle(1)).toBe('1');
        expect(formatRotationAngle(1.5)).toBe('1.50');
        expect(formatRotationAngle(1.5708)).toBe('1.57'); // close to π/2 but not exact
        expect(formatRotationAngle(-0.123456)).toBe('-0.12');
    });
});
