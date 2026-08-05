import { describe, expect, it } from 'vitest';
import { classifyText } from './documentModel.ts';

const HEADER = 'OPENQASM 3.0;\ninclude "stdgates.inc";\n';

describe('classifyText — document state', () => {
    it('accepts a document the transform can regenerate', () => {
        const { state, circuit, diagnostics } = classifyText(`${HEADER}qubit[2] q;\nh q[0];\n`);

        expect(state).toBe('editable');
        expect(circuit?.registers).toHaveLength(1);
        expect(diagnostics).toEqual([]);
    });

    it.each([
        ['a syntax error', `${HEADER}qubit[2 q;\n`],
        ['an unsupported construct', `${HEADER}qubit[2] q;\nbarrier q;\n`],
        ['a comment below the header', `${HEADER}qubit[2] q;\n// unten\nh q[0];\n`],
        ['an OpenQASM 2 header', 'OPENQASM 2.0;\nqreg q[2];\nh q[0];\n'],
        ['no qubit register', 'OPENQASM 3.0;\n'],
        ['nothing at all', ''],
    ])('keeps a document with %s read-only', (_case, source) => {
        expect(classifyText(source).state).toBe('readOnly');
    });

    it('hands the webview a circuit whenever one could be parsed', () => {
        // Read-only does not mean invisible: the supported part is still worth showing.
        const { state, circuit } = classifyText(`${HEADER}qubit[2] q;\nh q[0];\nbarrier q;\n`);

        expect(state).toBe('readOnly');
        expect(circuit?.layers).toHaveLength(1);
    });

    it('passes the preamble through, because applyEdit writes the file back with it', () => {
        const { preamble } = classifyText(`${HEADER}qubit[1] q;\n`);

        expect(preamble.version).toBe('3.0');
        expect(preamble.includes).toEqual(['"stdgates.inc"']);
    });
});

// Only what the user can act on. A cause explains its own consequences.
describe('classifyText — diagnostics', () => {
    const constructsIn = (source: string) => classifyText(source).diagnostics.map((entry) => entry.construct);

    it('reports syntax errors and nothing the recovered parse tree invented', () => {
        // The visitor walks on after a syntax error and rejects fragments that are not
        // real statements — reporting those next to the actual error is noise.
        const constructs = constructsIn(`${HEADER}qubit[2 q;\nh q[0]\nfoo q[1];\n`);

        expect(constructs).not.toHaveLength(0);
        expect(new Set(constructs)).toEqual(new Set(['syntax']));
    });

    it('says nothing per line when the version is the problem', () => {
        // `qreg` and every gate operand below it are consequences of the version.
        expect(classifyText('OPENQASM 2.0;\nqreg q[2];\nh q[0];\n').diagnostics).toEqual([]);
    });

    it('names the unsupported construct with the line it sits on', () => {
        const [diagnostic, ...rest] = classifyText(`${HEADER}qubit[2] q;\nbarrier q;\n`).diagnostics;

        expect(rest).toEqual([]);
        expect(diagnostic.construct).toBe('barrierStatement');
        expect(diagnostic.line).toBe(4);
        expect(diagnostic.message).toMatch(/barrier/i);
    });

    it('reports the comments that would be lost, so the opt-in is informed', () => {
        expect(constructsIn(`${HEADER}qubit[2] q;\n// unten\nh q[0];\n`)).toEqual(['comment']);
    });

    it('keeps quiet about comments while a construct blocks editing anyway', () => {
        // Accepting the comment loss would not unlock anything here.
        expect(constructsIn(`${HEADER}qubit[2] q;\n// unten\nbarrier q;\n`)).toEqual(['barrierStatement']);
    });

    it.each([
        ['an empty file', ''],
        ['a file with no register yet', 'OPENQASM 3.0;\n'],
        ['a started file whose only comment cannot be opted out of', 'OPENQASM 3.0;\n// hier\n'],
    ])('reports nothing for %s, where the notice says it all', (_case, source) => {
        expect(classifyText(source).diagnostics).toEqual([]);
    });
});
