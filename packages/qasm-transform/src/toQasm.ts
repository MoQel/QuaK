import {
    type AngleSymbols,
    type CircuitContent,
    type ElementSelectorDto,
    formatAngle as formatAngleWith,
    GATE_ARITY,
    toOperationIdentifier,
    getRegisterSize,
    isQuantumRegister,
    type MeasurementDto,
    type QuantumOperationDto,
} from '@quak/circuit-core';
import type { QasmPreamble } from './toCircuit.ts';
import { layerMarker, registerMarker } from './structuralComments.ts';

/** What a file gets when it had no header of its own: valid standalone OpenQASM. */
const DEFAULT_PREAMBLE: QasmPreamble = { version: '3.0', includes: ['"stdgates.inc"'], headerComments: [] };

/**
 * Writes a circuit back out as OpenQASM 3.
 *
 * Mirrors the backend generator for circuit statements. The extension also
 * writes the preserved preamble because it rewrites complete user files.
 */
export function toQasm(content: CircuitContent, preamble: QasmPreamble = DEFAULT_PREAMBLE): string {
    const registerNames = new Map(content.registers.map((register) => [register.id, register.name]));
    const lines: string[] = [];

    // Header comments stay above the generated document.
    for (const comment of preamble.headerComments) lines.push(comment);
    if (preamble.headerComments.length > 0) lines.push('');

    if (preamble.version) lines.push(`OPENQASM ${preamble.version};`);
    for (const include of preamble.includes) lines.push(`include ${include};`);
    if (preamble.version || preamble.includes.length > 0) lines.push('');

    for (const register of content.registers) {
        const type = isQuantumRegister(register) ? 'qubit' : 'bit';
        lines.push(registerMarker(register.name), `${type}[${getRegisterSize(register)}] ${register.name};`);
    }
    if (content.registers.length > 0) lines.push('');

    // Number only layers that still contain real operations.
    let layerNumber = 0;
    for (const layer of content.layers) {
        // Match the backend's stable top-to-bottom ordering.
        const operations = [...layer.quantumOperations]
            .filter((operation) => operation.type !== 'DUMMY')
            .sort((a, b) => minInvolvedQubitIndex(a) - minInvolvedQubitIndex(b));

        if (operations.length === 0) continue;

        lines.push(layerMarker(++layerNumber));
        for (const operation of operations) {
            lines.push(...operationToQasm(operation, registerNames));
        }
        lines.push('');
    }

    return `${lines.join('\n').trimEnd()}\n`;
}

const minInvolvedQubitIndex = (operation: QuantumOperationDto): number => {
    const indices = [...operation.targetQubits, ...(operation.controlQubits ?? [])].map((selector) => selector.index);
    return indices.length > 0 ? Math.min(...indices) : 0;
};

function operationToQasm(operation: QuantumOperationDto, registerNames: Map<string, string>): string[] {
    // A bare call would name a gate or circuit the file never declares.
    if (operation.type === 'COMPOSITE_QUANTUM_GATE' || operation.type === 'SUBCIRCUIT_OPERATION') {
        const kind = operation.type === 'COMPOSITE_QUANTUM_GATE' ? 'user-defined gate' : 'subcircuit';
        throw new Error(`Cannot write the ${kind} '${operation.identifier}' to QASM.`);
    }

    if (operation.type === 'MEASUREMENT') return measurementToQasm(operation, registerNames);

    // `inverseForm` is not emitted because this transform cannot read it back yet.
    let head = operation.identifier.toLowerCase();

    // Gate arity decides whether an angle is part of the QASM spelling.
    const identifier = toOperationIdentifier(operation.identifier);
    if (identifier && GATE_ARITY[identifier].hasRotationAngle && 'rotationAngle' in operation) {
        head += `(${formatAngle(operation.rotationAngle)})`;
    }

    // OpenQASM lists controls before targets.
    const operands = [...(operation.controlQubits ?? []), ...operation.targetQubits].map((selector) =>
        selectorToQasm(selector, registerNames),
    );

    return [operands.length > 0 ? `${head} ${operands.join(', ')};` : `${head};`];
}

/**
 * One `measure q[i] -> c[j];` per measured qubit. A measurement without a classic bit
 * would read back as unsupported, so it is refused and the host rejects the edit.
 */
function measurementToQasm(measurement: MeasurementDto, registerNames: Map<string, string>): string[] {
    const { targetQubits, classicBits } = measurement;
    if (targetQubits.length === 0 || classicBits.length !== targetQubits.length) {
        throw new Error('Cannot write a measurement to QASM without one classic bit per measured qubit.');
    }

    return targetQubits.map(
        (qubit, position) =>
            `measure ${selectorToQasm(qubit, registerNames)} -> ${selectorToQasm(classicBits[position], registerNames)};`,
    );
}

const selectorToQasm = (selector: ElementSelectorDto, registerNames: Map<string, string>): string =>
    `${registerNames.get(selector.registerId) ?? 'q'}[${selector.index}]`;

/**
 * QASM spelling for the constants `angleExpression` reads back.
 */
const QASM_ANGLE_SYMBOLS: AngleSymbols = {
    pi: 'pi',
    tau: 'tau',
    euler: 'euler',
    times: '*',
    plain: String,
};

/**
 * Formats an angle for QASM, symbolically where possible. A non-finite angle has no
 * QASM spelling; writing `0` for it would change the circuit without a word, so it is
 * refused and the host rejects the edit.
 */
export const formatAngle = (angle: number): string => {
    if (!Number.isFinite(angle)) throw new Error(`Cannot write a non-finite rotation angle (${angle}) to QASM.`);
    return formatAngleWith(angle, QASM_ANGLE_SYMBOLS);
};
