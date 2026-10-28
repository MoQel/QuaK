import { describe, it, expect } from 'vitest';
import { angleToLatex, angleToUnicode, formatRotationAngle, parseRotationAngle, resolveAngle } from './quantumAngle.ts';

describe('resolveAngle', () => {
    it('recognizes the common rotation constants as π multiples', () => {
        expect(resolveAngle(Math.PI)).toEqual({ kind: 'pi', numerator: 1, denominator: 1 });
        expect(resolveAngle(Math.PI / 2)).toEqual({ kind: 'pi', numerator: 1, denominator: 2 });
        expect(resolveAngle(Math.PI / 4)).toEqual({ kind: 'pi', numerator: 1, denominator: 4 });
        expect(resolveAngle(Math.PI / 8)).toEqual({ kind: 'pi', numerator: 1, denominator: 8 });
        // τ == 2π is modeled as the π multiple 2/1.
        expect(resolveAngle(2 * Math.PI)).toEqual({ kind: 'pi', numerator: 2, denominator: 1 });
    });

    it('recognizes deep power-of-two (QFT/phase) denominators', () => {
        expect(resolveAngle(Math.PI / 16)).toEqual({ kind: 'pi', numerator: 1, denominator: 16 });
        expect(resolveAngle(Math.PI / 32)).toEqual({ kind: 'pi', numerator: 1, denominator: 32 });
        expect(resolveAngle(Math.PI / 128)).toEqual({ kind: 'pi', numerator: 1, denominator: 128 });
    });

    it('recognizes negative constants', () => {
        expect(resolveAngle(-Math.PI / 4)).toEqual({ kind: 'pi', numerator: -1, denominator: 4 });
        expect(resolveAngle(-2 * Math.PI)).toEqual({ kind: 'pi', numerator: -2, denominator: 1 });
    });

    it('models an exact zero rotation as its own kind', () => {
        expect(resolveAngle(0)).toEqual({ kind: 'zero' });
        expect(resolveAngle(1e-12)).toEqual({ kind: 'zero' });
    });

    it('returns a plain number for values without a common π match', () => {
        expect(resolveAngle(1.23)).toEqual({ kind: 'number', radians: 1.23 });
        // π/13 is a valid fraction but not in the recognized denominators.
        expect(resolveAngle(Math.PI / 13)).toEqual({ kind: 'number', radians: Math.PI / 13 });
    });

    it('recognizes the same denominators everywhere, so no notation disagrees with the gate box', () => {
        // The gate label reads π/5 symbolically; Dirac, quantikz and QASM must not write 0.63 for it.
        expect(resolveAngle(Math.PI / 5)).toEqual({ kind: 'pi', numerator: 1, denominator: 5 });
        expect(resolveAngle(Math.PI / 16)).toEqual({ kind: 'pi', numerator: 1, denominator: 16 });
    });

    it('applies the tolerance in radians, independent of denominator', () => {
        const almostHalfPi = Math.PI / 2 + 1e-4;

        // Loose radian tolerance snaps it to π/2 ...
        expect(resolveAngle(almostHalfPi, { tolerance: 1e-3 })).toEqual({ kind: 'pi', numerator: 1, denominator: 2 });
        // ... the default (strict) tolerance keeps it numeric.
        expect(resolveAngle(almostHalfPi)).toEqual({ kind: 'number', radians: almostHalfPi });
    });

    it('honors a configurable denominator set', () => {
        // π/5 only matches when 5 is an allowed denominator.
        expect(resolveAngle(Math.PI / 5, { denominators: [1, 5] })).toEqual({
            kind: 'pi',
            numerator: 1,
            denominator: 5,
        });
    });

    describe('normalize', () => {
        it('does not fold by default', () => {
            expect(resolveAngle(3 * Math.PI)).toEqual({ kind: 'pi', numerator: 3, denominator: 1 });
        });

        it("folds onto (-π, π] with '2pi'", () => {
            expect(resolveAngle(2 * Math.PI, { normalize: '2pi' })).toEqual({ kind: 'zero' });
            expect(resolveAngle(3 * Math.PI, { normalize: '2pi' })).toEqual({
                kind: 'pi',
                numerator: 1,
                denominator: 1,
            });
        });

        it("folds onto (-2π, 2π] with '4pi', preserving the 4π periodicity", () => {
            // 3π ≡ -π under 4π periodicity (and stays distinct from π).
            expect(resolveAngle(3 * Math.PI, { normalize: '4pi' })).toEqual({
                kind: 'pi',
                numerator: -1,
                denominator: 1,
            });
            expect(resolveAngle(4 * Math.PI, { normalize: '4pi' })).toEqual({ kind: 'zero' });
        });
    });
});

describe('angle renderers', () => {
    it('renders π multiples as LaTeX', () => {
        expect(angleToLatex(resolveAngle(Math.PI))).toBe(String.raw`\pi`);
        expect(angleToLatex(resolveAngle(Math.PI / 2))).toBe(String.raw`\frac{\pi}{2}`);
        expect(angleToLatex(resolveAngle(-Math.PI / 4))).toBe(String.raw`-\frac{\pi}{4}`);
        expect(angleToLatex(resolveAngle(2 * Math.PI))).toBe(String.raw`2\pi`);
    });

    it('renders π multiples as Unicode', () => {
        expect(angleToUnicode(resolveAngle(Math.PI))).toBe('π');
        expect(angleToUnicode(resolveAngle(Math.PI / 2))).toBe('π/2');
        expect(angleToUnicode(resolveAngle(-Math.PI / 4))).toBe('-π/4');
        expect(angleToUnicode(resolveAngle(2 * Math.PI))).toBe('2π');
    });

    it('renders zero as 0 in every format', () => {
        expect(angleToLatex({ kind: 'zero' })).toBe('0');
        expect(angleToUnicode({ kind: 'zero' })).toBe('0');
    });

    it('rounds non-matching values to two decimals', () => {
        expect(angleToLatex(resolveAngle(1.23456))).toBe('1.23');
        expect(angleToUnicode(resolveAngle(1.23456))).toBe('1.23');
    });
});

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
