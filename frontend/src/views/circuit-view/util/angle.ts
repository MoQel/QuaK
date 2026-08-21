import { angleToUnicode, resolveAngle } from '@/lib/quantumAngle.ts';

const EPSILON = 1e-9;
// Denominators of π the gate box recognizes (up to 12), mirroring the backend's formatAngle.
const PI_DENOMINATORS = Array.from({ length: 12 }, (_, index) => index + 1);

/**
 * Formats a rotation angle (in radians) for compact display on a gate box.
 *
 * Mirrors the backend's `ElementaryQuantumGate.formatAngle` so the circuit label and the generated
 * OpenQASM stay consistent: the named constants τ (= 2π) and e (euler) are recognized first — these
 * are backend-specific and deliberately not part of the shared resolver — then the shared
 * {@link resolveAngle} handles rational multiples of π (denominator up to 12); anything else falls
 * back to a plain number. The stored angle keeps full precision — only the label is rounded.
 */
export function formatRotationAngle(angle: number): string {
    if (!Number.isFinite(angle) || angle === 0) return '0';

    return tryNamedConstant(angle) ?? angleToUnicode(resolveAngle(angle, { denominators: PI_DENOMINATORS }));
}

/** Matches the QASM parser's named constants, with a small tolerance for round-trip matching. */
function tryNamedConstant(angle: number): string | null {
    if (Math.abs(angle - 2 * Math.PI) < EPSILON) return 'τ';
    if (Math.abs(angle + 2 * Math.PI) < EPSILON) return '-τ';
    if (Math.abs(angle - Math.E) < EPSILON) return 'e';
    if (Math.abs(angle + Math.E) < EPSILON) return '-e';
    return null;
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
 * One optional sign, one optional factor, one optional named constant, one optional divisor —
 * `-2*pi/3`, `π/4`, `2pi`, `1.5708`, `tau`. The `*` and the whitespace are optional throughout.
 */
const ANGLE_PATTERN = /^([+-])?\s*(\d*\.?\d+)?\s*\*?\s*(pi|π|tau|τ|e)?\s*(?:\/\s*(\d*\.?\d+))?$/i;

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

    const match = ANGLE_PATTERN.exec(text);
    if (!match) return null;

    const [, sign, factorText, constantText, divisorText] = match;

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
