import type { RegisterResponse } from '@quak/circuit-core';
import { describe, expect, it } from 'vitest';
import { operationById } from '../../shared/operations.ts';
import { completionsFor, type CompletionSuggestion } from './completionModel.ts';

const quantum = (name: string, numberOfQubits: number): RegisterResponse => ({
    id: `qreg:${name}`,
    name,
    type: 'Quantum_Register',
    numberOfQubits,
});

const classical = (name: string, numberOfBits: number): RegisterResponse => ({
    id: `creg:${name}`,
    name,
    type: 'Classic_Register',
    numberOfBits,
});

const Q2 = [quantum('q', 2)];

const gates = (registers: readonly RegisterResponse[] = Q2) => completionsFor({ kind: 'gate' }, registers);

function suggestion(name: string, registers: readonly RegisterResponse[] = Q2): CompletionSuggestion {
    const found = gates(registers).find((candidate) => candidate.label === name);
    if (!found) throw new Error(`no suggestion for ${name}`);

    return found;
}

const insertOf = (name: string, registers: readonly RegisterResponse[] = Q2): string =>
    suggestion(name, registers).insert;

describe('completionsFor - gate calls', () => {
    it('offers only the gates the circuit editor can draw', () => {
        // A set, not a sequence: VSCode re-sorts the list by label.
        expect(
            gates()
                .map((entry) => entry.label)
                .sort(),
        ).toEqual(['ccx', 'cx', 'cz', 'h', 'rx', 'ry', 'rz', 's', 'swap', 't', 'x', 'y', 'z']);
    });

    it('carries the gate name and description', () => {
        const definition = operationById('h');
        if (!definition) throw new Error('the bundled library does not define h');

        expect(suggestion('h').detail).toBe(definition.name);
        expect(suggestion('h').documentation).toBe(definition.description);
    });

    it('fills the operands with declared wires', () => {
        expect(insertOf('h')).toBe('h ${1:q[0]};');
        expect(insertOf('cx')).toBe('cx ${1:q[0]}, ${2:q[1]};');
    });

    it('uses each wire at most once', () => {
        expect(insertOf('ccx', [quantum('q', 2), quantum('r', 1)])).toBe('ccx ${1:q[0]}, ${2:q[1]}, ${3:r[0]};');
    });

    it('falls back to role names when there are too few wires', () => {
        expect(insertOf('ccx', Q2)).toBe('ccx ${1:control1}, ${2:control2}, ${3:target};');
        expect(insertOf('h', [])).toBe('h ${1:target};');
        expect(insertOf('swap', [])).toBe('swap ${1:target1}, ${2:target2};');
    });

    it('leaves classical registers out of the operands', () => {
        // `h c[0]` is not a gate call. A classical bit is no qubit.
        expect(insertOf('cx', [classical('c', 4), quantum('q', 2)])).toBe('cx ${1:q[0]}, ${2:q[1]};');
    });

    it('puts the angle of a rotation in the first tab stop', () => {
        expect(insertOf('rx')).toBe('rx(${1:pi/2}) ${2:q[0]};');
    });
});

describe('completionsFor - register indices', () => {
    it('offers one entry per qubit of the register', () => {
        const suggestions = completionsFor({ kind: 'index', register: 'q' }, [quantum('q', 3)]);

        expect(suggestions.map((entry) => entry.label)).toEqual(['0', '1', '2']);
        expect(suggestions[2].detail).toBe('q[2]');
    });

    it('sorts by number rather than alphabetically', () => {
        const suggestions = completionsFor({ kind: 'index', register: 'q' }, [quantum('q', 11)]);
        const sorted = [...suggestions].sort((a, b) => (a.sortText ?? '').localeCompare(b.sortText ?? ''));

        expect(sorted.map((entry) => entry.label)).toEqual(suggestions.map((entry) => entry.label));
        expect(sorted.at(-1)?.label).toBe('10');
    });

    it('offers nothing for an undeclared register', () => {
        expect(completionsFor({ kind: 'index', register: 'nope' }, Q2)).toEqual([]);
    });
});
