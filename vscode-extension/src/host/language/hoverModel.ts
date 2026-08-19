import {
    GATE_ARITY,
    getRegisterSize,
    isGateSupported,
    isStandardGate,
    isQuantumRegister,
    toOperationIdentifier,
    type MatrixInfoDto,
    type RegisterResponse,
} from '@quak/circuit-core';
import { operationById } from '../../shared/operations.ts';
import type { QasmWord } from './qasmContext.ts';

/** The Markdown a hover shows, or null when there is nothing to say about the word. */
export function hoverFor(word: QasmWord, registers: readonly RegisterResponse[]): string | null {
    switch (word.role) {
        case 'gate':
            return gateHover(word.text);
        case 'register':
            return registerHover(word.text, registers);
        case 'keyword':
            return KEYWORD_HOVERS[word.text] ?? null;
    }
}

/**
 * Decides in the order `resolveSupportedGate` does: unknown name, gate this editor
 * cannot draw, supported gate. Keeps the hover from contradicting the diagnostic on
 * the same line.
 */
function gateHover(name: string): string | null {
    if (!isStandardGate(name)) return null;

    const identifier = toOperationIdentifier(name);
    const definition = operationById(name.toLowerCase());
    if (!identifier || !isGateSupported(identifier)) {
        return [
            definition ? `\`${name}\` — ${definition.name}` : `\`${name}\``,
            '',
            definition?.description ?? 'A gate the OpenQASM standard library defines.',
            '',
            'The circuit editor cannot draw it, so a file using it stays read-only.',
        ].join('\n');
    }

    const arity = GATE_ARITY[identifier];
    const angle = definition?.parameters?.length ? `(${definition.parameters.join(', ')})` : '';

    return [
        `**${definition?.name ?? name}** — \`${name}${angle}\``,
        '',
        definition?.description ?? '',
        '',
        operandLine(arity.totalSize, arity.controlSize),
        matrixBlock(definition?.inspectorInfo.matrix),
    ]
        .filter((part) => part !== '')
        .join('\n');
}

/** OpenQASM writes controls first, so their number is what makes an operand list readable. */
function operandLine(total: number, controls: number): string {
    const qubits = `${total} ${total === 1 ? 'qubit' : 'qubits'}`;
    if (controls === 0) return `Acts on ${qubits}.`;

    return `Acts on ${qubits}: ${controls} control${controls === 1 ? '' : 's'}, then the target.`;
}

/**
 * A plain grid, up to 4×4. VSCode renders no LaTeX in a hover, and of the operations
 * shipped only the Toffoli is larger — 8×8 squeezed into a hover is read wrong more
 * easily than the description is.
 */
function matrixBlock(matrix: MatrixInfoDto | undefined): string {
    if (!matrix || matrix.computable.length === 0 || matrix.rows > 4 || matrix.cols > 4) return '';

    const widths = matrix.computable[0].map((_, column) =>
        Math.max(...matrix.computable.map((row) => row[column].length)),
    );
    const rows = matrix.computable.map((row) => row.map((cell, column) => cell.padStart(widths[column])).join('  '));

    return ['', '```text', ...rows, '```'].join('\n');
}

function registerHover(name: string, registers: readonly RegisterResponse[]): string | null {
    const register = registers.find((candidate) => candidate.name === name);
    if (!register) return null;

    const size = getRegisterSize(register);
    const kind = isQuantumRegister(register) ? 'qubit register' : 'classical register';

    return [`**${name}** — ${kind}`, '', `${size} ${size === 1 ? 'wire' : 'wires'}: ${wires(name, size)}`].join('\n');
}

/** Long registers are named by their ends. */
function wires(name: string, size: number): string {
    const label = (index: number): string => `\`${name}[${index}]\``;
    if (size <= 4) return Array.from({ length: size }, (_, index) => label(index)).join(', ');

    return `${label(0)} … ${label(size - 1)}`;
}

/** Only where this editor has something of its own to say. */
const KEYWORD_HOVERS: Readonly<Record<string, string>> = {
    qubit: ['**qubit** — declares a qubit register.', '', 'The circuit editor draws one wire per qubit.'].join('\n'),
    bit: [
        '**bit** — declares a classical register.',
        '',
        'The circuit model carries qubits only, so a file declaring one stays read-only.',
    ].join('\n'),
    measure: [
        `**measure** — ${operationById('measure')?.description ?? 'measures a qubit.'}`,
        '',
        'The circuit editor cannot write measurement back, so a file using it stays read-only.',
    ].join('\n'),
};
