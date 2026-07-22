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
