import {
    getRegisterSize,
    isQuantumRegister,
    type CircuitContent,
    type ElementSelectorDto,
    type QuantumOperationDto,
} from '@quak/circuit-core';
import type { QasmPreamble } from './toCircuit.ts';
import { layerMarker, registerMarker } from './structuralComments.ts';

/** What a file gets when it had no header of its own — valid standalone OpenQASM. */
const DEFAULT_PREAMBLE: QasmPreamble = { version: '3.0', includes: ['"stdgates.inc"'], headerComments: [] };

const GATE_KEYWORDS: Record<string, string> = {
    H: 'h',
    X: 'x',
    Y: 'y',
    Z: 'z',
    CX: 'cx',
    CZ: 'cz',
    SWAP: 'swap',
    CCX: 'ccx',
    S: 's',
    T: 't',
    RX: 'rx',
    RY: 'ry',
    RZ: 'rz',
    MEASURE: 'measure',
};

/**
 * Writes a circuit back out as OpenQASM 3.
 *
 * Port of the backend's `QasmCodeGenerator`, with two deliberate differences.
 *
 * It emits the preamble. The Java generator writes neither the version nor the
 * includes, so its output is not valid standalone OpenQASM and a round trip
 * loses the user's header.
 *
 * It writes the user's header comments back. Those are the only comments with an
 * anchor that survives: "the top of the file". Comments further down belong to
 * statements the editor may reorder or delete, so the parser reports them and the
 * document is read-only rather than being silently rewritten without them.
 *
 * The `// Register`/`// Layer` markers are emitted, as the Java generator does.
 * They are not content — their text is a pure function of the circuit — so the
 * parser recognizes and ignores them, and writing them back is a no-op.
 */
export function toQasm(content: CircuitContent, preamble: QasmPreamble = DEFAULT_PREAMBLE): string {
    const registerNames = new Map(content.registers.map((register) => [register.id, register.name]));
    const lines: string[] = [];

    // The header block the user wrote, above everything else, exactly where it was.
    for (const comment of preamble.headerComments) lines.push(comment);
    if (preamble.headerComments.length > 0) lines.push('');

    if (preamble.version) lines.push(`OPENQASM ${preamble.version};`);
    for (const include of preamble.includes) lines.push(`include ${include};`);
    if (preamble.version || preamble.includes.length > 0) lines.push('');

    for (const register of content.registers) {
        if (!isQuantumRegister(register)) continue;
        lines.push(registerMarker(register.name));
        lines.push(`qubit[${getRegisterSize(register)}] ${register.name};`);
    }
    if (content.registers.length > 0) lines.push('');

    content.layers.forEach((layer, layerIdx) => {
        // Canonical order (topmost involved qubit first) so that generating and
        // re-parsing yields a stable layout instead of shuffling the circuit.
        const operations = [...layer.quantumOperations]
            .filter((operation) => operation.type !== 'DUMMY')
            .sort((a, b) => minInvolvedQubitIndex(a) - minInvolvedQubitIndex(b));

        if (operations.length === 0) return;

        lines.push(layerMarker(layerIdx + 1));
        for (const operation of operations) {
            lines.push(operationToQasm(operation, registerNames));
        }
        lines.push('');
    });

    return `${lines.join('\n').trimEnd()}\n`;
}

const minInvolvedQubitIndex = (operation: QuantumOperationDto): number => {
    const indices = [...operation.targetQubits, ...(operation.controlQubits ?? [])].map((selector) => selector.index);
    return indices.length > 0 ? Math.min(...indices) : 0;
};

function operationToQasm(operation: QuantumOperationDto, registerNames: Map<string, string>): string {
    const keyword = GATE_KEYWORDS[operation.identifier] ?? operation.identifier.toLowerCase();

    let head = operation.inverseForm ? `inv @ ${keyword}` : keyword;
    if ('rotationAngle' in operation && operation.rotationAngle !== 0) {
        head += `(${formatAngle(operation.rotationAngle)})`;
    }

    // OpenQASM lists controls before targets — the same order the parser splits on.
    const operands = [...(operation.controlQubits ?? []), ...operation.targetQubits].map((selector) =>
        selectorToQasm(selector, registerNames),
    );

    return operands.length > 0 ? `${head} ${operands.join(', ')};` : `${head};`;
}

const selectorToQasm = (selector: ElementSelectorDto, registerNames: Map<string, string>): string =>
    `${registerNames.get(selector.registerId) ?? 'q'}[${selector.index}]`;

const CONSTANT_MATCH_EPSILON = 1e-9;

/**
 * Formats an angle for QASM, symbolically where possible ("tau", "pi/2",
 * "2*pi/3") so it survives a generate → parse → generate round trip instead of
 * decaying into drifting decimals.
 *
 * Not to be confused with circuit-core's `formatRotationAngle`, which produces
 * "π/2" for a gate box. Same idea, different audiences: one has to parse back,
 * the other has to fit in 30 pixels.
 */
export function formatAngle(angle: number): string {
    // Never emit "Infinity"/"NaN" — they are not QASM tokens.
    if (!Number.isFinite(angle) || angle === 0) return '0';

    return tryNamedConstant(angle) ?? tryPiMultiple(angle) ?? formatPlainNumber(angle);
}

// tau is checked before the pi logic so 2*pi comes out as "tau", matching the backend.
function tryNamedConstant(angle: number): string | null {
    if (Math.abs(angle - 2 * Math.PI) < CONSTANT_MATCH_EPSILON) return 'tau';
    if (Math.abs(angle + 2 * Math.PI) < CONSTANT_MATCH_EPSILON) return '-tau';
    if (Math.abs(angle - Math.E) < CONSTANT_MATCH_EPSILON) return 'euler';
    if (Math.abs(angle + Math.E) < CONSTANT_MATCH_EPSILON) return '-euler';
    return null;
}

function tryPiMultiple(angle: number): string | null {
    const ratio = angle / Math.PI;
    for (let denominator = 1; denominator <= 12; denominator++) {
        const scaled = ratio * denominator;
        const numerator = Math.round(scaled);
        if (numerator !== 0 && Math.abs(scaled - numerator) < CONSTANT_MATCH_EPSILON) {
            const divisor = gcd(Math.abs(numerator), denominator);
            return buildPiTerm(numerator / divisor, denominator / divisor);
        }
    }
    return null;
}

function buildPiTerm(numerator: number, denominator: number): string {
    const sign = numerator < 0 ? '-' : '';
    const magnitude = Math.abs(numerator);
    const piPart = magnitude === 1 ? 'pi' : `${magnitude}*pi`;
    return denominator === 1 ? `${sign}${piPart}` : `${sign}${piPart}/${denominator}`;
}

const formatPlainNumber = (angle: number): string => (Number.isInteger(angle) ? String(angle) : String(angle));

function gcd(a: number, b: number): number {
    while (b !== 0) {
        [a, b] = [b, a % b];
    }
    return a;
}
