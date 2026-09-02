import type { RegisterResponse } from '@quak/circuit-core';
import { describe, expect, it } from 'vitest';
import { hoverFor } from './hoverModel.ts';
import type { QasmWord, WordRole } from './qasmContext.ts';

const word = (text: string, role: WordRole): QasmWord => ({ text, role, start: 0, end: text.length });

const REGISTERS: RegisterResponse[] = [
    { id: 'qreg:q', name: 'q', type: 'Quantum_Register', numberOfQubits: 2 },
    { id: 'qreg:wide', name: 'wide', type: 'Quantum_Register', numberOfQubits: 12 },
];

const hover = (text: string, role: WordRole): string | null => hoverFor(word(text, role), REGISTERS);

describe('hoverFor: gates', () => {
    it('names a supported gate, describes it and shows its matrix', () => {
        const text = hover('h', 'gate');

        expect(text).toContain('Hadamard');
        expect(text).toContain('equal superposition');
        expect(text).toContain('1/sqrt(2)');
    });

    it('says which operands a controlled gate takes, because OpenQASM writes controls first', () => {
        expect(hover('cx', 'gate')).toContain('2 qubits: 1 control and 1 target');
    });

    it('separates the blocks by a blank line, or Markdown runs them into one', () => {
        expect(hover('h', 'gate')).toMatch(/^\*\*Hadamard\*\* \(`h`\)\n\nCreates/);
    });

    it('names the angle a rotation gate carries', () => {
        expect(hover('rx', 'gate')).toContain('`rx(theta)`');
    });

    it('leaves out a matrix too large to read in a hover', () => {
        const text = hover('ccx', 'gate');

        expect(text).toContain('Toffoli');
        expect(text).not.toContain('```');
    });

    it('separates a gate this editor cannot draw from one that does not exist', () => {
        expect(hover('sdg', 'gate')).toContain('read-only');
        expect(hover('foo', 'gate')).toBeNull();
    });

    it('follows OpenQASM in being case sensitive', () => {
        // `H` is undefined in OpenQASM, and the transform reports it as unknown.
        expect(hover('H', 'gate')).toBeNull();
        // `CX` is not: stdgates.inc declares it for OpenQASM 2 compatibility.
        expect(hover('CX', 'gate')).toContain('CNOT');
    });
});

describe('hoverFor: registers', () => {
    it('gives the size and names the wires', () => {
        const text = hover('q', 'register');

        expect(text).toContain('qubit register');
        expect(text).toContain('`q[0]`, `q[1]`');
    });

    it('names only the ends of a long register', () => {
        expect(hover('wide', 'register')).toContain('`wide[0]` … `wide[11]`');
    });

    it('says nothing about a name no declaration introduced', () => {
        expect(hover('nope', 'register')).toBeNull();
    });

    it('says nothing when the document could not be parsed into registers', () => {
        expect(hoverFor(word('q', 'register'), [])).toBeNull();
    });
});

describe('hoverFor: keywords', () => {
    it('explains what this editor does with a declaration', () => {
        expect(hover('qubit', 'keyword')).toContain('one wire per qubit');
        expect(hover('bit', 'keyword')).toContain('read-only');
    });

    it('leaves the language to itself where it has nothing of its own to say', () => {
        expect(hover('OPENQASM', 'keyword')).toBeNull();
        expect(hover('for', 'keyword')).toBeNull();
    });
});
