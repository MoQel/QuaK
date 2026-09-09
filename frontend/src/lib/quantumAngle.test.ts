import { describe, it, expect } from 'vitest';
import { angleToLatex, angleToUnicode, resolveAngle } from './quantumAngle';

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
        // π/5 is a valid fraction but not in the curated common denominators.
        expect(resolveAngle(Math.PI / 5)).toEqual({ kind: 'number', radians: Math.PI / 5 });
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
