import { describe, expect, it } from 'vitest';
import { parseQasm } from './parse.ts';

const HEADER = 'OPENQASM 3.0;\ninclude "stdgates.inc";\n';

// Half-written files are the normal state while someone is typing, so where these
// errors point decides whether the editor is helpful or in the way.
describe('parseQasm — a file that stops mid-statement', () => {
    it('points at the last line the user wrote, not behind the final newline', () => {
        // ANTLR blames the EOF token, which sits on the empty line after the newline —
        // a line the reader cannot see.
        const [error, ...rest] = parseQasm(`${HEADER}qubit[2] q;\n\n// Layer 1\nh q[\n`).errors;

        expect(rest).toEqual([]);
        expect(error.line).toBe(6);
        expect(error.column).toBe(4);
    });

    it('lands in the same place whether or not the file ends with a newline', () => {
        const withNewline = parseQasm(`${HEADER}qubit[2] q;\nh q[\n`).errors;
        const without = parseQasm(`${HEADER}qubit[2] q;\nh q[`).errors;

        expect(withNewline).toEqual(without);
    });

    it('ignores trailing blank lines when looking for the last thing written', () => {
        const { errors } = parseQasm(`${HEADER}qubit[2] q;\nh q[\n\n   \n\n`);

        expect(errors[0].line).toBe(4);
    });

    it('says the statement is unfinished instead of quoting the input', () => {
        // "no viable alternative at input 'hq['" describes tokens the reader never
        // typed next to each other.
        expect(parseQasm(`${HEADER}qubit[2] q;\nh q[\n`).errors[0].message).toMatch(/ends in the middle/i);
    });
});

// ANTLR reports the position of the token it is holding. For something left out that
// is the token *after* the gap, which the hidden channel can put lines away: blank
// lines and comments are skipped before the parser notices anything is wrong.
describe('parseQasm — a token that was left out', () => {
    it('points at the gap, not at the statement that happens to follow it', () => {
        // ANTLR blames the `h` three lines down, past a blank line and a comment.
        const [error, ...rest] = parseQasm(
            'OPENQASM 3.0;\n\n// Register q\nqubit[2] q\n\n// Layer 1\nh q[0];\n',
        ).errors;

        expect(rest).toEqual([]);
        expect(error.line).toBe(4);
        expect(error.column).toBe(10);
    });

    it('names what is missing and what it should follow', () => {
        // ANTLR's own "missing ';' at 'h'" names the innocent token.
        const [error] = parseQasm(`${HEADER}qubit[2] q\nh q[0];\n`).errors;

        expect(error.message).toBe("Missing ';' after 'q'.");
    });

    it('places a missing bracket right after the token before it', () => {
        const [error] = parseQasm(`${HEADER}qubit[2 q;\nh q[0];\n`).errors;

        expect(error.line).toBe(3);
        expect(error.column).toBe(7);
        expect(error.message).toBe("Missing ']' after '2'.");
    });
});

describe('parseQasm — errors ANTLR already places well', () => {
    it('leaves an unwanted token where it is, because that is the problem', () => {
        const [error] = parseQasm(`${HEADER}qubit[2]] q;\n`).errors;

        expect(error.line).toBe(3);
        expect(error.column).toBe(8);
        expect(error.message).toMatch(/extraneous input/);
    });

    it('keeps ANTLR wording for a lexer error, which is precise enough', () => {
        const [error] = parseQasm(`${HEADER}qubit[2] q;\nh q[0] §;\n`).errors;

        expect(error.line).toBe(4);
        expect(error.message).toMatch(/token recognition error/);
    });

    it('reports a clean file as clean', () => {
        expect(parseQasm(`${HEADER}qubit[2] q;\nh q[0];\n`).errors).toEqual([]);
    });
});
