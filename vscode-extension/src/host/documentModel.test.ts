import { describe, expect, it } from 'vitest';
import {
    ClassificationCache,
    classifyText,
    diagnosticsFor,
    positionOf,
    type DiagnosticCategories,
    type DocumentDiagnostic,
} from './documentModel.ts';

const ALL: DiagnosticCategories = { errors: true, syncSupport: true };

const HEADER = 'OPENQASM 3.0;\ninclude "stdgates.inc";\n';
const EDITABLE = `${HEADER}qubit[2] q;\nh q[0];\n`;

describe('classifyText: document state', () => {
    it('accepts a document the transform can regenerate', () => {
        const { state, circuit } = classifyText(`${HEADER}qubit[2] q;\nh q[0];\n`);

        expect(state).toBe('editable');
        expect(circuit?.registers).toHaveLength(1);
    });

    it.each([
        ['a syntax error', `${HEADER}qubit[2 q;\n`],
        ['an unsupported construct', `${HEADER}qubit[2] q;\nbarrier q;\n`],
        ['a rotation gate without its angle', `${HEADER}qubit[2] q;\nrx q[0];\n`],
        ['a comment below the header', `${HEADER}qubit[2] q;\n// below\nh q[0];\n`],
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

    it.each([
        ['a version without a number', 'OPENQASM'],
        ['an include without a closing quote', `${HEADER}include "x.inc;\n`],
        ['a register declaration without a name', `${HEADER}qubit[] q;\n`],
        ['a register declaration cut off at the size', `${HEADER}qubit[;\n`],
    ])('reads %s as a broken document, not as a defect of ours', (_case, source) => {
        // A throw here would reach the user as a notice about the extension, not the file.
        expect(classifyText(source).state).toBe('readOnly');
    });

    it('keeps the circuit on screen while the next line is being typed', () => {
        // A transform that gave up on the first syntax error would leave the pane empty.
        const { state, circuit } = classifyText(`${HEADER}qubit[2] q;\nh q[0];\nrx(\n`);

        expect(state).toBe('readOnly');
        expect(circuit?.registers).toHaveLength(1);
        expect(circuit?.layers).toHaveLength(1);
    });

    it('passes the preamble through, because applyEdit writes the file back with it', () => {
        const { preamble } = classifyText(`${HEADER}qubit[1] q;\n`);

        expect(preamble.version).toBe('3.0');
        expect(preamble.includes).toEqual(['"stdgates.inc"']);
    });
});

// Counting reads is the point: what the cache saves is a full ANTLR parse per keystroke.
describe('ClassificationCache', () => {
    function fakeDocument(uri: string, text: string) {
        let reads = 0;
        let failure: Error | undefined;
        const document = {
            uri: { toString: () => uri },
            version: 1,
            getText: () => {
                reads += 1;
                if (failure) throw failure;
                return text;
            },
        };

        return {
            document,
            get reads() {
                return reads;
            },
            edit(next: string) {
                text = next;
                failure = undefined;
                document.version += 1;
            },
            reopen(next: string) {
                text = next;
                document.version = 1;
            },
            /** Stands in for a defect in the transform, which is the case worth covering. */
            breakWith(error: Error) {
                failure = error;
                document.version += 1;
            },
        };
    }

    // Rethrown rather than ignored: a test on this path is not meant to be passing
    // because the cache quietly caught something.
    const unexpectedFailure = (error: unknown): never => {
        throw error;
    };

    it('parses a document version once, however often it is asked', () => {
        const cache = new ClassificationCache(unexpectedFailure);
        const file = fakeDocument('file:///a.qasm', EDITABLE);

        expect(cache.of(file.document)).toBe(cache.of(file.document));
        expect(file.reads).toBe(1);
    });

    it('parses again once the document has changed', () => {
        const cache = new ClassificationCache(unexpectedFailure);
        const file = fakeDocument('file:///a.qasm', EDITABLE);

        expect(cache.of(file.document)?.state).toBe('editable');
        file.edit(`${HEADER}qubit[2] q;\nbarrier q;\n`);

        expect(cache.of(file.document)?.state).toBe('readOnly');
        expect(file.reads).toBe(2);
    });

    it('keeps documents apart, because a version only means something within one of them', () => {
        const cache = new ClassificationCache(unexpectedFailure);
        const editable = fakeDocument('file:///a.qasm', EDITABLE);
        const other = fakeDocument('file:///b.qasm', `${HEADER}qubit[2] q;\nbarrier q;\n`);

        expect(cache.of(editable.document)?.state).toBe('editable');
        expect(cache.of(other.document)?.state).toBe('readOnly');
    });

    it('parses a reopened document again, which is what forgetting a closed one is for', () => {
        // Reopening restarts at version 1, and the file may have changed meanwhile.
        const cache = new ClassificationCache(unexpectedFailure);
        const file = fakeDocument('file:///a.qasm', EDITABLE);

        expect(cache.of(file.document)?.state).toBe('editable');
        cache.forget(file.document);
        file.reopen(`${HEADER}qubit[2] q;\nbarrier q;\n`);

        expect(cache.of(file.document)?.state).toBe('readOnly');
    });

    it('reports a failure instead of letting it escape into the event handler', () => {
        const failures: unknown[] = [];
        const cache = new ClassificationCache((error) => failures.push(error));
        const file = fakeDocument('file:///a.qasm', EDITABLE);
        const defect = new Error('transform defect');
        file.breakWith(defect);

        expect(cache.of(file.document)).toBeNull();
        expect(failures).toEqual([defect]);
    });

    it('reports a failure once per version, however many features ask', () => {
        const failures: unknown[] = [];
        const cache = new ClassificationCache((error) => failures.push(error));
        const file = fakeDocument('file:///a.qasm', EDITABLE);
        file.breakWith(new Error('transform defect'));

        cache.of(file.document);
        cache.of(file.document);
        cache.of(file.document);

        expect(failures).toHaveLength(1);
    });

    it('names the document it could not analyse', () => {
        const contexts: string[] = [];
        const cache = new ClassificationCache((_error, context) => contexts.push(context));
        const file = fakeDocument('file:///broken.qasm', EDITABLE);
        file.breakWith(new Error('transform defect'));

        cache.of(file.document);

        expect(contexts).toEqual(['file:///broken.qasm']);
    });

    it('recovers once the document changes again, so a failure is not a dead end', () => {
        const cache = new ClassificationCache(() => {});
        const file = fakeDocument('file:///a.qasm', EDITABLE);
        file.breakWith(new Error('transform defect'));

        expect(cache.of(file.document)).toBeNull();
        file.edit(EDITABLE);

        expect(cache.of(file.document)?.state).toBe('editable');
    });

    it('holds nothing for a document that was closed', () => {
        const cache = new ClassificationCache(unexpectedFailure);
        const file = fakeDocument('file:///a.qasm', EDITABLE);

        cache.of(file.document);
        expect(cache.size).toBe(1);

        cache.forget(file.document);
        expect(cache.size).toBe(0);
    });
});

// Only what the user can act on. A cause explains its own consequences.
describe('diagnosticsFor', () => {
    const diagnosticsIn = (source: string, categories: DiagnosticCategories = ALL) =>
        diagnosticsFor(classifyText(source).classification, categories);
    const constructsIn = (source: string, categories: DiagnosticCategories = ALL) =>
        diagnosticsIn(source, categories).map((entry) => entry.construct);

    it('reports syntax errors and nothing the recovered parse tree invented', () => {
        // The visitor walks on after a syntax error and rejects fragments that are not
        // real statements, and reporting those next to the actual error is noise.
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
        // The file is valid OpenQASM. It is this editor that cannot write it back.
        expect(diagnosticsIn(`${HEADER}qubit[2] q;\nbarrier q;\n`)[0].severity).toBe('info');
    });

    it('reports the comments that would be lost, so the opt-in is informed', () => {
        const [diagnostic, ...rest] = diagnosticsIn(`${HEADER}qubit[2] q;\n// below\nh q[0];\n`);

        expect(rest).toEqual([]);
        expect(diagnostic.construct).toBe('comment');
        expect(diagnostic.severity).toBe('hint');
    });

    it('reports the error alone when only error reporting is switched on', () => {
        expect(constructsIn(`${HEADER}qubit[2 q;\n`, { errors: true, syncSupport: false })).toEqual(['syntax']);
    });

    it.each([
        ['an unsupported construct', `${HEADER}qubit[2] q;\nbarrier q;\n`],
        ['a comment below the header', `${HEADER}qubit[2] q;\n// below\nh q[0];\n`],
    ])('says nothing about %s while support is switched off', (_case, source) => {
        expect(diagnosticsIn(source, { errors: true, syncSupport: false })).toEqual([]);
    });

    it('keeps the sync support findings while error reporting is switched off', () => {
        // The two are independent: nobody else reports what this editor cannot write back.
        expect(constructsIn(`${HEADER}qubit[2] q;\nbarrier q;\n`, { errors: false, syncSupport: true })).toEqual([
            'barrierStatement',
        ]);
    });

    it('says nothing about a broken document while error reporting is switched off', () => {
        expect(diagnosticsIn(`${HEADER}qubit[2 q;\n`, { errors: false, syncSupport: true })).toEqual([]);
    });

    it('keeps quiet about comments while a construct blocks editing anyway', () => {
        // Accepting the comment loss would not unlock anything here.
        expect(constructsIn(`${HEADER}qubit[2] q;\n// below\nbarrier q;\n`)).toEqual(['barrierStatement']);
    });

    it.each([
        ['an empty file', ''],
        ['a file with no register yet', 'OPENQASM 3.0;\n'],
        ['a started file whose only comment cannot be opted out of', 'OPENQASM 3.0;\n// here\n'],
        ['a document the editor can regenerate', `${HEADER}qubit[2] q;\nh q[0];\n`],
    ])('reports nothing for %s, where the notice says it all', (_case, source) => {
        expect(diagnosticsIn(source)).toEqual([]);
    });
});

// A missing token is reported at the end of the line before it, which is where a
// range would start empty. Whether that stays visible is decided in diagnostics.ts,
// but the input to it is pinned here.
describe('diagnosticsFor: findings that sit at the end of a line', () => {
    it('places a missing token past the last character of its line', () => {
        const source = 'OPENQASM 3.0;\n\n// Register q\nqubit[2] q\n\n// Layer 1\nh q[0];\n';
        const [diagnostic] = diagnosticsFor(classifyText(source).classification, ALL);
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
        // ANTLR counts lines from 1 and columns from 0. VSCode counts both from 0.
        expect(positionOf(at(4, 4))).toEqual({ line: 3, column: 4 });
        expect(positionOf(at(1, 0))).toEqual({ line: 0, column: 0 });
    });

    it('never goes negative, for a construct the parser could not place', () => {
        // `builder.reject` falls back to line 0 when a context carries no token.
        expect(positionOf(at(0, 0))).toEqual({ line: 0, column: 0 });
    });
});
