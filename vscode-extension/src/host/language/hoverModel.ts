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

/** Decides in the order `resolveSupportedGate` does, so a hover cannot contradict the diagnostic below it. */
function gateHover(name: string): string | null {
    if (!isStandardGate(name)) return null;

    const identifier = toOperationIdentifier(name);
    const definition = operationById(name.toLowerCase());
    if (!identifier || !isGateSupported(identifier)) {
        return paragraphs(
            definition ? `\`${name}\` (${definition.name})` : `\`${name}\``,
            definition?.description ?? 'A gate the OpenQASM standard library defines.',
            'QuaK cannot draw this gate, so a file using it opens read-only in the circuit view.',
        );
    }

    const arity = GATE_ARITY[identifier];
    const angle = definition?.parameters?.length ? `(${definition.parameters.join(', ')})` : '';

    return paragraphs(
        `**${definition?.name ?? name}** (\`${name}${angle}\`)`,
        definition?.description,
        operandLine(arity.controlSize, arity.targetSize),
        matrixBlock(definition?.inspectorInfo.matrix),
    );
}

/** A blank line between blocks; without it Markdown runs them into one line. */
const paragraphs = (...blocks: (string | undefined)[]): string => blocks.filter(Boolean).join('\n\n');

/** OpenQASM writes controls before targets. */
function operandLine(controls: number, targets: number): string {
    const total = plural(controls + targets, 'qubit');
    if (controls === 0) return `Acts on ${total}.`;

    return `Acts on ${total}: ${plural(controls, 'control')} and ${plural(targets, 'target')}, in that order.`;
}

const plural = (amount: number, noun: string): string => `${amount} ${noun}${amount === 1 ? '' : 's'}`;

/** A plain grid up to 4×4: a hover renders no LaTeX, and anything larger is read wrong more easily than the description. */
function matrixBlock(matrix: MatrixInfoDto | undefined): string | undefined {
    if (!matrix || matrix.computable.length === 0 || matrix.rows > 4 || matrix.cols > 4) return undefined;

    const widths = matrix.computable[0].map((_, column) =>
        Math.max(...matrix.computable.map((row) => row[column].length)),
    );
    const rows = matrix.computable.map((row) => row.map((cell, column) => cell.padStart(widths[column])).join('  '));

    return ['```text', ...rows, '```'].join('\n');
}

function registerHover(name: string, registers: readonly RegisterResponse[]): string | null {
    const register = registers.find((candidate) => candidate.name === name);
    if (!register) return null;

    const size = getRegisterSize(register);
    const kind = isQuantumRegister(register) ? 'qubit register' : 'classical register';

    return paragraphs(`**${name}** (${kind})`, `${plural(size, 'wire')}: ${wires(name, size)}`);
}

function wires(name: string, size: number): string {
    const label = (index: number): string => `\`${name}[${index}]\``;
    if (size <= 4) return Array.from({ length: size }, (_, index) => label(index)).join(', ');

    return `${label(0)} … ${label(size - 1)}`;
}

const KEYWORD_HOVERS: Readonly<Record<string, string>> = {
    qubit: paragraphs('**qubit** declares a qubit register.', 'QuaK draws one wire per qubit.'),
    bit: paragraphs(
        '**bit** declares a classical register.',
        'The circuit view shows qubits only, so a file declaring one opens read-only.',
    ),
    measure: paragraphs(
        `**measure**: ${operationById('measure')?.description ?? 'measures a qubit.'}`,
        'Measurement cannot be edited in the circuit view yet, so a file using it opens read-only.',
    ),
};
