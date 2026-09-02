import { describe, expect, it } from 'vitest';
import { parseQasm } from './parse.ts';
import { HEADER } from './testFixtures.ts';

// Half-written files are the normal state while someone is typing, so where these
// errors point decides whether the editor is helpful or in the way.
describe('parseQasm: a file that stops mid-statement', () => {
    it('points at the last line the user wrote, not behind the final newline', () => {
        // ANTLR blames the EOF token, which sits on the empty line after the newline,
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
describe('parseQasm: a token that was left out', () => {
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

describe('parseQasm: errors ANTLR already places well', () => {
    it('leaves an unwanted token where it is, because that is the problem', () => {
        const [error] = parseQasm(`${HEADER}qubit[2]] q;\n`).errors;

        expect(error.line).toBe(3);
        expect(error.column).toBe(8);
        expect(error.message).toBe("Unexpected ']'.");
    });

    it('quotes the character a lexer error is about, not the phrase ANTLR uses for it', () => {
        const [error] = parseQasm(`${HEADER}qubit[2] q;\nh q[0] §;\n`).errors;

        expect(error.line).toBe(4);
        expect(error.message).toBe("Unexpected character '§'.");
    });

    it('reports a clean file as clean', () => {
        expect(parseQasm(`${HEADER}qubit[2] q;\nh q[0];\n`).errors).toEqual([]);
    });
});

// The fast first stage reports nothing and gives up on more than just broken files,
// so everything below it has to come out of the second stage unchanged.
describe('parseQasm: what the fast stage skips', () => {
    it('reports a missing token, the one kind of error the fast stage swallows', () => {
        // `missing ';'` fails a token match rather than an alternative prediction, and
        // that path throws past the error listener when the parser is told to bail.
        const { errors } = parseQasm(`${HEADER}qubit[2] q\nh q[0];\n`);

        expect(errors).toHaveLength(1);
    });

    it('still returns the recovered tree of a broken file', () => {
        const { tree } = parseQasm(`${HEADER}qubit[2] q\nh q[0];\n`);

        expect(tree.statementOrScope()).not.toHaveLength(0);
    });

    it('keeps the comments of a file that parses cleanly', () => {
        const { comments } = parseQasm(`${HEADER}// Register q\nqubit[2] q;\n`);

        expect(comments.map((comment) => comment.text)).toEqual(['// Register q']);
    });
});

// ANTLR words its errors for a grammar author, down to listing every token that could
// have followed. None of that reaches the document.
describe('parseQasm: a statement the parser cannot read at all', () => {
    const MISSING_SEMICOLON = `${HEADER}qubit[2] q;\nh q[0]\nx q[1];\n`;

    it('anchors it where it starts, not where the parser finally gave up', () => {
        // ANTLR blames the `x` on the line below, the token that ruled everything out.
        const [error] = parseQasm(MISSING_SEMICOLON).errors;

        expect(error.line).toBe(4);
        expect(error.column).toBe(0);
        expect(error.message).toBe('This statement cannot be read.');
    });

    it('reports it once, not again for the separator recovery went on to want', () => {
        // The second report read `Missing ';' after 'x'`, about a token that is fine.
        expect(parseQasm(MISSING_SEMICOLON).errors).toHaveLength(1);
    });

    it('still reports a later mistake of its own', () => {
        const { errors } = parseQasm(`${MISSING_SEMICOLON}qubit[3 r;\n`);

        expect(errors.map((error) => error.line)).toEqual([4, 6]);
    });
});
