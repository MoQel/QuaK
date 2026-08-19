import { describe, expect, it } from 'vitest';
import { wordAt, type WordRole } from './qasmContext.ts';

const HEADER = 'OPENQASM 3.0;\ninclude "stdgates.inc";\n';

/** Marks the cursor in the source, so a test reads as what a user is pointing at. */
function at(source: string): ReturnType<typeof wordAt> {
    const offset = source.indexOf('|');
    expect(offset, 'every case marks the cursor with |').toBeGreaterThan(-1);

    return wordAt(source.replace('|', ''), offset);
}

describe('wordAt — which word', () => {
    it('finds the word the cursor sits inside', () => {
        expect(at('h q[0];\nc|x q[0], q[1];')?.text).toBe('cx');
    });

    it('finds the word the cursor sits at the end of', () => {
        expect(at('cx| q[0], q[1];')?.text).toBe('cx');
    });

    it.each([
        ['whitespace', 'h | q[0];'],
        // A number literal shares the character class of an identifier and names nothing.
        ['a register index', 'qubit[|2] q;'],
        ['punctuation', 'h q[0]|;'],
    ])('says nothing about %s', (_case, source) => {
        expect(at(source)).toBeNull();
    });

    it('says nothing inside a line comment', () => {
        expect(at(`${HEADER}qubit[2] q;\n// the |h below\nh q[0];`)).toBeNull();
    });

    it('says nothing inside a block comment', () => {
        expect(at(`${HEADER}/* a |h */\nqubit[2] q;`)).toBeNull();
    });

    it('says nothing inside an include string', () => {
        expect(at('include "stdga|tes.inc";')).toBeNull();
    });

    it('reads on again after a block comment ends', () => {
        expect(at('/* off */ |h q[0];')?.role).toBe('gate');
    });

    it.each([
        ['a half-typed include', 'OPENQASM 3.0;\ninclude "stdgates.inc;\nqubit[2] q;\n|h q[0];'],
        ['a stray apostrophe', "qubit[2] q;\nx' ;\n|h q[0];"],
    ])('reads on past %s, because a quote with no partner on its line opens nothing', (_case, source) => {
        expect(at(source)?.role).toBe('gate');
    });
});

describe('wordAt — which role', () => {
    it.each<[string, string, WordRole]>([
        ['the first identifier of a statement', 'qubit[2] q;\n|h q[0];', 'gate'],
        ['an operand', 'qubit[2] q;\nh |q[0];', 'register'],
        ['the name in a declaration', 'qubit[2] |q;', 'register'],
        ['the type in a declaration', '|qubit[2] q;', 'keyword'],
        ['a language keyword', '|OPENQASM 3.0;', 'keyword'],
        ['the gate behind a modifier', 'ctrl @ |x q[0], q[1];', 'gate'],
        ['a modifier itself', '|ctrl @ x q[0], q[1];', 'keyword'],
        ['an operand of a measurement', 'measure |q[0] -> c[0];', 'register'],
    ])('calls %s a %s', (_case, source, role) => {
        expect(at(source)?.role).toBe(role);
    });

    it('starts a new statement at the semicolon, not at the newline', () => {
        // Both halves on one line: the second gate is still the first word of its statement.
        expect(at('h q[0]; |x q[1];')?.role).toBe('gate');
    });

    it('keeps reading one statement across several lines', () => {
        expect(at('cx\n  q[0],\n  |q[1];')?.role).toBe('register');
    });

    it('does not let a comment between statements pass for the statement itself', () => {
        expect(at('qubit[2] q;\n// draw a hadamard\n|h q[0];')?.role).toBe('gate');
    });
});
