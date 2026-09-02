import {
    GATE_ARITY,
    isGateSupported,
    isQuantumRegister,
    getRegisterSize,
    toOperationIdentifier,
    type GateArity,
    type OperationDefinitionResponse,
    type RegisterResponse,
} from '@quak/circuit-core';
import { OPERATIONS } from '../../shared/operations.ts';
import type { CompletionContext } from './qasmContext.ts';

export interface CompletionSuggestion {
    label: string;
    /** Snippet syntax, with `${n:...}` tab stops. */
    insert: string;
    detail: string;
    documentation?: string;
    /** Set where alphabetical order would be wrong, as it is for numbers. */
    sortText?: string;
}

/** The gates QuaK can draw, spelled the way a gate call writes them. */
const SUPPORTED = OPERATIONS.flatMap((operation) => {
    const identifier = toOperationIdentifier(operation.id);

    return identifier && isGateSupported(identifier) ? [{ operation, arity: GATE_ARITY[identifier] }] : [];
});

export function completionsFor(
    context: CompletionContext,
    registers: readonly RegisterResponse[],
): CompletionSuggestion[] {
    return context.kind === 'gate' ? gateCalls(registers) : indices(context.register, registers);
}

const gateCalls = (registers: readonly RegisterResponse[]): CompletionSuggestion[] =>
    SUPPORTED.map(({ operation, arity }) => ({
        label: operation.id,
        insert: gateCall(operation, arity, wires(registers)),
        detail: operation.name,
        documentation: operation.description,
    }));

function gateCall(operation: OperationDefinitionResponse, arity: GateArity, available: readonly string[]): string {
    const angle = operation.parameters?.length ? `(\${1:pi/2})` : '';
    const first = angle ? 2 : 1;
    const operands = operandsFor(arity, available).map((operand, position) => `\${${first + position}:${operand}}`);

    return `${operation.id}${angle} ${operands.join(', ')};`;
}

/**
 * One wire per operand, never the same twice: `cx q[0], q[0]` is not even unitary.
 * Falls back to naming the roles when the document has too few wires to go around.
 */
function operandsFor(arity: GateArity, available: readonly string[]): string[] {
    const total = arity.controlSize + arity.targetSize;
    if (available.length >= total) return available.slice(0, total);

    return [...roles('control', arity.controlSize), ...roles('target', arity.targetSize)];
}

const roles = (role: string, count: number): string[] =>
    Array.from({ length: count }, (_, index) => (count === 1 ? role : `${role}${index + 1}`));

// Gate operands are qubits, so a classical register supplies none.
const wires = (registers: readonly RegisterResponse[]): string[] =>
    registers
        .filter(isQuantumRegister)
        .flatMap((register) =>
            Array.from({ length: register.numberOfQubits }, (_, index) => `${register.name}[${index}]`),
        );

function indices(name: string, registers: readonly RegisterResponse[]): CompletionSuggestion[] {
    const register = registers.find((candidate) => candidate.name === name);
    if (!register) return [];

    const size = getRegisterSize(register);
    const width = String(size - 1).length;

    return Array.from({ length: size }, (_, index) => ({
        label: String(index),
        insert: String(index),
        detail: `${name}[${index}]`,
        sortText: String(index).padStart(width, '0'),
    }));
}
