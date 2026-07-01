// Denominators of π tried during recognition, in ascending order. Curated for quantum gates:
// powers of two cover phase/QFT angles (π/2, π/4, …, π/128), while 3/6/12 cover the common
// thirds and sixths. Uncommon fractions like π/5 or π/7 are intentionally excluded here — pass
// a custom `denominators` list to `resolveAngle` for a fully general formatter.
const DEFAULT_PI_DENOMINATORS = [1, 2, 3, 4, 6, 8, 12, 16, 32, 64, 128];
const DEFAULT_TOLERANCE = 1e-9;

const TWO_PI = 2 * Math.PI;
const FOUR_PI = 4 * Math.PI;

/**
 * Format-independent, symbolic representation of a rotation angle — the shared "model" that
 * every output format (LaTeX, Unicode, OpenQASM, …) is rendered from.
 *
 * - zero: an exact (within tolerance) zero rotation.
 * - pi: a rational multiple of π, i.e. `(numerator / denominator) * π`, always stored in the lowest terms with `denominator ≥ 1` and `numerator ≠ 0`. Named constants are just special
 *   cases: `2π` (τ) is `{ numerator: 2, denominator: 1 }` - weather that is `2π`, `τ`, or `\tau` is a renderer decision.
 * - number: any angle that does not match a known π multiple keeps the full-precision value.
 */
export type QuantumAngle =
    | { kind: 'zero' }
    | { kind: 'pi'; numerator: number; denominator: number }
    | { kind: 'number'; radians: number };

export interface ResolveAngleOptions {
    /** True radian tolerance when matching against a π multiple. Defaults to 1e-9. */
    tolerance?: number;
    /** Denominators of π to try, in ascending order. Defaults to a curated common set. */
    denominators?: number[];
    /**
     * Canonicalize the angle before recognition.
     * - 'none': use θ as-is.
     * - '2pi': θ mod 2π.
     * - '4pi': θ mod 4π.
     */
    normalize?: 'none' | '2pi' | '4pi';
}

/**
 * Recognizes a rotation angle (in radians) as a symbolic {@link QuantumAngle}.
 *
 * This is the single, output-format-agnostic resolver shared by all mappers/displays: it only decides *what* the angle is, never *how* it is written.
 * Values that are not a common multiple of π are returned as `{ kind: 'number' }`.
 */
export function resolveAngle(radians: number, options: ResolveAngleOptions = {}): QuantumAngle {
    const tolerance = options.tolerance ?? DEFAULT_TOLERANCE;
    const denominators = options.denominators ?? DEFAULT_PI_DENOMINATORS;

    if (!Number.isFinite(radians)) return { kind: 'number', radians };

    const normalized = normalizeRadians(radians, options.normalize ?? 'none');

    if (Math.abs(normalized) < tolerance) return { kind: 'zero' };

    for (const denominator of denominators) {
        const numerator = Math.round((normalized * denominator) / Math.PI);

        if (numerator === 0) continue;

        // Compare in radians so `tolerance` means the same thing regardless of denominator.
        const candidate = (numerator * Math.PI) / denominator;
        if (Math.abs(normalized - candidate) < tolerance) {
            const divisor = gcd(Math.abs(numerator), denominator);
            return { kind: 'pi', numerator: numerator / divisor, denominator: denominator / divisor };
        }
    }

    return { kind: 'number', radians: normalized };
}

/** Folds an angle onto a canonical window (see {@link ResolveAngleOptions.normalize}). */
function normalizeRadians(radians: number, mode: NonNullable<ResolveAngleOptions['normalize']>): number {
    if (mode === 'none') return radians;

    const period = mode === '4pi' ? FOUR_PI : TWO_PI;
    const half = period / 2;

    let wrapped = radians % period; // (-period, period)
    if (wrapped > half) wrapped -= period;
    else if (wrapped <= -half) wrapped += period;

    return wrapped;
}

/** Renders a {@link QuantumAngle} as a LaTeX math string (e.g. `\frac{\pi}{2}`, `2\pi`). */
export function angleToLatex(angle: QuantumAngle): string {
    if (angle.kind === 'zero') return '0';
    if (angle.kind === 'number') return formatDecimal(angle.radians);

    const sign = angle.numerator < 0 ? '-' : '';
    const absNumerator = Math.abs(angle.numerator);
    const piTerm = absNumerator === 1 ? String.raw`\pi` : String.raw`${absNumerator}\pi`;

    return angle.denominator === 1 ? `${sign}${piTerm}` : String.raw`${sign}\frac{${piTerm}}{${angle.denominator}}`;
}

/** Renders a {@link QuantumAngle} as a Unicode string for plain UI display (e.g. `π/2`, `2π`). */
export function angleToUnicode(angle: QuantumAngle): string {
    if (angle.kind === 'zero') return '0';
    if (angle.kind === 'number') return formatDecimal(angle.radians);

    const sign = angle.numerator < 0 ? '-' : '';
    const absNumerator = Math.abs(angle.numerator);
    const piTerm = absNumerator === 1 ? 'π' : `${absNumerator}π`;

    return angle.denominator === 1 ? `${sign}${piTerm}` : `${sign}${piTerm}/${angle.denominator}`;
}

/** Rounds a plain angle to two decimals for display; `?` for non-finite input. */
function formatDecimal(radians: number): string {
    if (!Number.isFinite(radians)) return '?';
    return Number(radians.toFixed(2)).toString();
}

function gcd(a: number, b: number): number {
    let x = a;
    let y = b;

    while (y !== 0) {
        [x, y] = [y, x % y];
    }

    return x || 1;
}
