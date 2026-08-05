import { describe, expect, it } from 'vitest';
import { classifyText, diagnosticsFor, positionOf, type DocumentDiagnostic } from './documentModel.ts';

const HEADER = 'OPENQASM 3.0;\ninclude "stdgates.inc";\n';

describe('classifyText — document state', () => {
    it('accepts a document the transform can regenerate', () => {
        const { state, circuit } = classifyText(`${HEADER}qubit[2] q;\nh q[0];\n`);

        expect(state).toBe('editable');
        expect(circuit?.registers).toHaveLength(1);
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
describe('diagnosticsFor', () => {
    const diagnosticsIn = (source: string) => diagnosticsFor(classifyText(source).classification);
    const constructsIn = (source: string) => diagnosticsIn(source).map((entry) => entry.construct);

    it('reports syntax errors and nothing the recovered parse tree invented', () => {
        // The visitor walks on after a syntax error and rejects fragments that are not
        // real statements — reporting those next to the actual error is noise.
        const constructs = constructsIn(`${HEADER}qubit[2 q;\nh q[0]\nfoo q[1];\n`);

        expect(constructs).not.toHaveLength(0);
        expect(new Set(constructs)).toEqual(new Set(['syntax']));
    });

    it('marks a syntax error as an error, unlike everything else it reports', () => {
        expect(diagnosticsIn(`${HEADER}qubit[2 q;\n`)[0].severity).toBe('error');
    });

    it('says nothing per line when the version is the problem', () => {
        // `qreg` and every gate operand below it are consequences of the version.
        expect(diagnosticsIn('OPENQASM 2.0;\nqreg q[2];\nh q[0];\n')).toEqual([]);
    });

    it('names the unsupported construct where it sits', () => {
        const [diagnostic, ...rest] = diagnosticsIn(`${HEADER}qubit[2] q;\nbarrier q;\n`);

        expect(rest).toEqual([]);
        expect(diagnostic.construct).toBe('barrierStatement');
        expect(diagnostic.line).toBe(4);
        expect(diagnostic.message).toMatch(/barrier/i);
    });

    it('reports the column ANTLR gave it, counted from zero', () => {
        // The number a VSCode Range is built from. Off by one here is off by one there.
        const [diagnostic] = diagnosticsIn(`${HEADER}qubit[2] q;\n    barrier q;\n`);

        expect(diagnostic.line).toBe(4);
        expect(diagnostic.column).toBe(4);
    });

    it('treats unsupported constructs as information, not as a defect', () => {
        // The file is valid OpenQASM; it is this editor that cannot write it back.
        expect(diagnosticsIn(`${HEADER}qubit[2] q;\nbarrier q;\n`)[0].severity).toBe('info');
    });

    it('reports the comments that would be lost, so the opt-in is informed', () => {
        const [diagnostic, ...rest] = diagnosticsIn(`${HEADER}qubit[2] q;\n// unten\nh q[0];\n`);

        expect(rest).toEqual([]);
        expect(diagnostic.construct).toBe('comment');
        expect(diagnostic.severity).toBe('hint');
    });

    it('keeps quiet about comments while a construct blocks editing anyway', () => {
        // Accepting the comment loss would not unlock anything here.
        expect(constructsIn(`${HEADER}qubit[2] q;\n// unten\nbarrier q;\n`)).toEqual(['barrierStatement']);
    });

    it.each([
        ['an empty file', ''],
        ['a file with no register yet', 'OPENQASM 3.0;\n'],
        ['a started file whose only comment cannot be opted out of', 'OPENQASM 3.0;\n// hier\n'],
        ['a document the editor can regenerate', `${HEADER}qubit[2] q;\nh q[0];\n`],
    ])('reports nothing for %s, where the notice says it all', (_case, source) => {
        expect(diagnosticsIn(source)).toEqual([]);
    });
});

// A missing token is reported at the end of the line before it, which is where a
// range would start empty. Whether that stays visible is decided in diagnostics.ts,
// but the input to it is pinned here.
describe('diagnosticsFor — findings that sit at the end of a line', () => {
    it('places a missing token past the last character of its line', () => {
        const source = 'OPENQASM 3.0;\n\n// Register q\nqubit[2] q\n\n// Layer 1\nh q[0];\n';
        const [diagnostic] = diagnosticsFor(classifyText(source).classification);
        const line = source.split('\n')[diagnostic.line - 1];

        expect(diagnostic.line).toBe(4);
        expect(diagnostic.column).toBe(line.length);
    });
});

// The one place where two counting conventions meet.
describe('positionOf', () => {
    const at = (line: number, column: number): DocumentDiagnostic => ({
        line,
        column,
        construct: 'barrierStatement',
        message: '',
        severity: 'info',
    });

    it('shifts the line down by one and leaves the column alone', () => {
        // ANTLR counts lines from 1 and columns from 0; VSCode counts both from 0.
        expect(positionOf(at(4, 4))).toEqual({ line: 3, column: 4 });
        expect(positionOf(at(1, 0))).toEqual({ line: 0, column: 0 });
    });

    it('never goes negative, for a construct the parser could not place', () => {
        // `builder.reject` falls back to line 0 when a context carries no token.
        expect(positionOf(at(0, 0))).toEqual({ line: 0, column: 0 });
    });
});
