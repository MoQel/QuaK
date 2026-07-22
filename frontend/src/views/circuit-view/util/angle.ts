/**
 * Formats a rotation angle (in radians) for compact display on a gate box.
 *
 * Mirrors the backend's `ElementaryQuantumGate.formatAngle` so the circuit and the
 * generated OpenQASM stay consistent: the named constants τ (= 2π) and e (euler) are
 * recognized first, then rational multiples of π with a denominator up to 12
 * (e.g. "π", "2π", "π/2", "-π/4", "2π/3"); anything else falls back to an integer or a
 * 2-decimal number. The stored angle keeps full precision — only the label is rounded.
 */
export function formatRotationAngle(angle: number): string {
    if (!Number.isFinite(angle) || angle === 0) return '0';

    return tryNamedConstant(angle) ?? tryPiMultiple(angle) ?? formatPlainNumber(angle);
}

/** Matches the QASM parser's named constants, with a small tolerance for round-trip matching. */
const EPSILON = 1e-9;

function tryNamedConstant(angle: number): string | null {
    if (Math.abs(angle - 2 * Math.PI) < EPSILON) return 'τ';
    if (Math.abs(angle + 2 * Math.PI) < EPSILON) return '-τ';
    if (Math.abs(angle - Math.E) < EPSILON) return 'e';
    if (Math.abs(angle + Math.E) < EPSILON) return '-e';
    return null;
}

/** Tries to express the angle as a rational multiple of π (denominator up to 12). */
function tryPiMultiple(angle: number): string | null {
    const ratio = angle / Math.PI;
    for (let denominator = 1; denominator <= 12; denominator++) {
        const scaled = ratio * denominator;
        const numerator = Math.round(scaled);
        if (numerator !== 0 && Math.abs(scaled - numerator) < EPSILON) {
            const divisor = gcd(Math.abs(numerator), denominator);
            return buildPiTerm(numerator / divisor, denominator / divisor);
        }
    }
    return null;
}

function buildPiTerm(numerator: number, denominator: number): string {
    const sign = numerator < 0 ? '-' : '';
    const magnitude = Math.abs(numerator);
    const piPart = magnitude === 1 ? 'π' : `${magnitude}π`;
    return denominator === 1 ? `${sign}${piPart}` : `${sign}${piPart}/${denominator}`;
}

function formatPlainNumber(angle: number): string {
    return Number.isInteger(angle) ? String(angle) : angle.toFixed(2);
}

function gcd(a: number, b: number): number {
    while (b !== 0) {
        [a, b] = [b, a % b];
    }
    return a;
}
