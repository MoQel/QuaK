// Recognized denominators of pi: everything up to 12, plus the powers of two QFT and
// phase gates use. One list for every notation, so the gate box, the Dirac view, the
// quantikz export and the QASM writer agree on which angles have a symbolic form.
// Pass `denominators` for anything outside that set.
const DEFAULT_PI_DENOMINATORS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16, 32, 64, 128];
const DEFAULT_TOLERANCE = 1e-9;

const TWO_PI = 2 * Math.PI;
const FOUR_PI = 4 * Math.PI;

export type QuantumAngle =
    | { kind: 'zero' }
    | { kind: 'pi'; numerator: number; denominator: number }
    | { kind: 'number'; radians: number };

export interface ResolveAngleOptions {
    /** True radian tolerance when matching against a pi multiple. */
    tolerance?: number;
    /** Denominators of pi to try, in ascending order. */
    denominators?: number[];
    /** Fold the angle into a canonical window before recognition. */
    normalize?: 'none' | '2pi' | '4pi';
}

/** Recognizes a radian angle without deciding how a target format writes it. */
export function resolveAngle(radians: number, options: ResolveAngleOptions = {}): QuantumAngle {
    const tolerance = options.tolerance ?? DEFAULT_TOLERANCE;
    const denominators = options.denominators ?? DEFAULT_PI_DENOMINATORS;

    if (!Number.isFinite(radians)) return { kind: 'number', radians };

    const normalized = normalizeRadians(radians, options.normalize ?? 'none');
    if (Math.abs(normalized) < tolerance) return { kind: 'zero' };

    for (const denominator of denominators) {
        const numerator = Math.round((normalized * denominator) / Math.PI);
        if (numerator === 0) continue;

        const candidate = (numerator * Math.PI) / denominator;
        if (Math.abs(normalized - candidate) < tolerance) {
            const divisor = gcd(Math.abs(numerator), denominator);
            return { kind: 'pi', numerator: numerator / divisor, denominator: denominator / divisor };
        }
    }

    return { kind: 'number', radians: normalized };
}

/** Renders an angle as LaTeX math, e.g. `\frac{\pi}{2}`. */
export function angleToLatex(angle: QuantumAngle): string {
    if (angle.kind === 'zero') return '0';
    if (angle.kind === 'number') return formatDisplayDecimal(angle.radians);

    const sign = angle.numerator < 0 ? '-' : '';
    const magnitude = Math.abs(angle.numerator);
    const piTerm = magnitude === 1 ? String.raw`\pi` : String.raw`${magnitude}\pi`;

    return angle.denominator === 1 ? `${sign}${piTerm}` : String.raw`${sign}\frac{${piTerm}}{${angle.denominator}}`;
}

/** Renders an angle for compact UI labels, e.g. `pi/2` as `π/2`. */
export function angleToUnicode(angle: QuantumAngle): string {
    if (angle.kind === 'zero') return '0';
    if (angle.kind === 'number') return formatDisplayDecimal(angle.radians);

    const sign = angle.numerator < 0 ? '-' : '';
    const magnitude = Math.abs(angle.numerator);
    const piTerm = magnitude === 1 ? 'π' : `${magnitude}π`;

    return angle.denominator === 1 ? `${sign}${piTerm}` : `${sign}${piTerm}/${angle.denominator}`;
}

/**
 * How an angle is spelled. QASM and UI labels share recognition but use
 * different alphabets: `2*pi/3` in QASM, `2π/3` in the editor.
 */
export interface AngleSymbols {
    pi: string;
    tau: string;
    euler: string;
    /** Between a coefficient and π: "" for display ("2π"), "*" for QASM ("2*pi"). */
    times: string;
    /** An angle with no symbolic form. Display rounds it; QASM must not. */
    plain: (angle: number) => string;
}

/**
 * Formats an angle in radians, symbolically where possible.
 *
 * This compatibility API keeps the existing QASM and gate-label callers stable
 * while newer notation code can use `resolveAngle` plus a renderer directly.
 */
export function formatAngle(angle: number, symbols: AngleSymbols): string {
    if (!Number.isFinite(angle) || angle === 0) return '0';

    return tryNamedConstant(angle, symbols) ?? angleToSymbols(resolveAngle(angle), symbols) ?? symbols.plain(angle);
}

const DISPLAY_SYMBOLS: AngleSymbols = {
    pi: 'π',
    tau: 'τ',
    euler: 'e',
    times: '',
    plain: formatDisplayDecimal,
};

/** Formats a rotation angle for compact display on a gate box. */
export const formatRotationAngle = (angle: number): string => formatAngle(angle, DISPLAY_SYMBOLS);

// tau is checked before the pi logic so that 2π comes out as "τ" rather than "2π".
function tryNamedConstant(angle: number, symbols: AngleSymbols): string | null {
    if (Math.abs(angle - TWO_PI) < DEFAULT_TOLERANCE) return symbols.tau;
    if (Math.abs(angle + TWO_PI) < DEFAULT_TOLERANCE) return `-${symbols.tau}`;
    if (Math.abs(angle - Math.E) < DEFAULT_TOLERANCE) return symbols.euler;
    if (Math.abs(angle + Math.E) < DEFAULT_TOLERANCE) return `-${symbols.euler}`;
    return null;
}

function angleToSymbols(angle: QuantumAngle, symbols: AngleSymbols): string | null {
    if (angle.kind === 'zero') return '0';
    if (angle.kind === 'number') return null;

    return buildPiTerm(angle.numerator, angle.denominator, symbols);
}

function buildPiTerm(numerator: number, denominator: number, symbols: AngleSymbols): string {
    const sign = numerator < 0 ? '-' : '';
    const magnitude = Math.abs(numerator);
    const piPart = magnitude === 1 ? symbols.pi : `${magnitude}${symbols.times}${symbols.pi}`;
    return denominator === 1 ? `${sign}${piPart}` : `${sign}${piPart}/${denominator}`;
}

function gcd(a: number, b: number): number {
    let x = a;
    let y = b;

    while (y !== 0) {
        [x, y] = [y, x % y];
    }

    return x || 1;
}

function normalizeRadians(radians: number, mode: NonNullable<ResolveAngleOptions['normalize']>): number {
    if (mode === 'none') return radians;

    const period = mode === '4pi' ? FOUR_PI : TWO_PI;
    const half = period / 2;

    let wrapped = radians % period;
    if (wrapped > half) wrapped -= period;
    else if (wrapped <= -half) wrapped += period;

    return wrapped;
}

/** Rounds a plain angle to two decimals for display, without trailing zeros; `?` for non-finite input. */
function formatDisplayDecimal(radians: number): string {
    if (!Number.isFinite(radians)) return '?';
    return Number(radians.toFixed(2)).toString();
}

/** The named constants the QASM parser knows, spelled the way they may be typed. */
const NAMED_CONSTANTS: Record<string, number> = {
    pi: Math.PI,
    π: Math.PI,
    tau: 2 * Math.PI,
    τ: 2 * Math.PI,
    e: Math.E,
};

/**
 * A decimal number, written so it can match only one way.
 *
 * The obvious `\d*\.?\d+` is ambiguous — for `123` the two parts can split four ways — and every
 * split is retried when the rest of the pattern fails, which is what made this quadratic on input
 * that turns out not to be an angle.
 */
const NUMBER = String.raw`\d+(?:\.\d+)?|\.\d+`;

/**
 * The part before any `/`: an optional sign, an optional factor, an optional named constant —
 * `-2*pi`, `π`, `2pi`, `1.5708`, `tau`.
 *
 * The separator is `\s*(?:\*\s*)?` rather than `\s*\*?\s*`: the latter can split a run of spaces
 * at any point, so it backtracks through every position before giving up.
 */
const MAGNITUDE_PATTERN = new RegExp(String.raw`^([+-])?\s*(${NUMBER})?\s*(?:\*\s*)?(pi|π|tau|τ|e)?$`, 'i');

/** The part after the `/`: a plain number, nothing else. */
const DIVISOR_PATTERN = new RegExp(`^(${NUMBER})$`);

/**
 * Reads an angle the user typed, in radians, or null when it is not an angle.
 *
 * The inverse of {@link formatRotationAngle}, and it has to be: the box shows `π/2`, so that is what
 * someone editing it will type back. Accepting only decimals would mean every edit silently rounds
 * the angle to whatever was typed, and a `parse → toCode` round trip would turn a clean `pi/2` into
 * `1.57`. Plain numbers are still accepted, since that is what an angle from elsewhere looks like.
 *
 * Deliberately not a full expression evaluator: sums and nested parentheses are rejected rather than
 * half-supported, which keeps a typo an error instead of a silently different circuit.
 */
export function parseRotationAngle(input: string): number | null {
    const text = input.trim();
    if (text === '') return null;

    // Split on the divisor first, so neither half has to describe the other. One `/` at most.
    const parts = text.split('/');
    if (parts.length > 2) return null;

    const match = MAGNITUDE_PATTERN.exec(parts[0].trim());
    if (!match) return null;

    const [, sign, factorText, constantText] = match;

    let divisorText: string | undefined;
    if (parts.length === 2) {
        divisorText = parts[1].trim();
        if (!DIVISOR_PATTERN.test(divisorText)) return null;
    }

    // Something must actually be there: the pattern's parts are all optional, so a lone "-" or "/2"
    // would otherwise come out as 0 rather than as the error it is.
    if (factorText === undefined && constantText === undefined) return null;

    const factor = factorText === undefined ? 1 : Number(factorText);
    const constant = constantText === undefined ? 1 : NAMED_CONSTANTS[constantText.toLowerCase()];
    const divisor = divisorText === undefined ? 1 : Number(divisorText);

    if (divisor === 0) return null;

    const magnitude = (factor * constant) / divisor;
    if (!Number.isFinite(magnitude)) return null;

    return sign === '-' ? -magnitude : magnitude;
}
