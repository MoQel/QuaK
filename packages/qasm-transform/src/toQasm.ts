import {
    type AngleSymbols,
    type CircuitContent,
    type ElementSelectorDto,
    formatAngle as formatAngleWith,
    GATE_ARITY,
    getRegisterSize,
    isQuantumRegister,
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

    // CircuitContent carries only quantum registers.
    const quantumRegisters = content.registers.filter(isQuantumRegister);
    for (const register of quantumRegisters) {
        lines.push(registerMarker(register.name), `qubit[${getRegisterSize(register)}] ${register.name};`);
    }
    if (quantumRegisters.length > 0) lines.push('');

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
            lines.push(operationToQasm(operation, registerNames));
        }
        lines.push('');
    }

    return `${lines.join('\n').trimEnd()}\n`;
}

const minInvolvedQubitIndex = (operation: QuantumOperationDto): number => {
    const indices = [...operation.targetQubits, ...(operation.controlQubits ?? [])].map((selector) => selector.index);
    return indices.length > 0 ? Math.min(...indices) : 0;
};

function operationToQasm(operation: QuantumOperationDto, registerNames: Map<string, string>): string {
    // `inverseForm` is not emitted because this transform cannot read it back yet.
    let head = operation.identifier.toLowerCase();

    // Gate arity decides whether an angle is part of the QASM spelling.
    if (GATE_ARITY[operation.identifier]?.hasRotationAngle && 'rotationAngle' in operation) {
        head += `(${formatAngle(operation.rotationAngle)})`;
    }

    // OpenQASM lists controls before targets.
    const operands = [...(operation.controlQubits ?? []), ...operation.targetQubits].map((selector) =>
        selectorToQasm(selector, registerNames),
    );

    return operands.length > 0 ? `${head} ${operands.join(', ')};` : `${head};`;
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
 * Formats an angle for QASM, symbolically where possible.
 */
export const formatAngle = (angle: number): string => formatAngleWith(angle, QASM_ANGLE_SYMBOLS);
