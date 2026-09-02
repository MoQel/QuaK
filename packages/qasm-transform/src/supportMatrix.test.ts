import { describe, expect, it } from 'vitest';
import { GATE_ARITY, SUPPORT_MATRIX, isGateSupported, unsupportedStatementRules } from '@quak/circuit-core';
import { OpenQASM3Parser } from './generated/OpenQASM3Parser.js';
import { isEditable, toCircuit } from './toCircuit.ts';
import { HEADER } from './testFixtures.ts';

// The matrix is useful only if the transform cannot quietly disagree with it.
describe('support matrix is consistent with the rest of the transform', () => {
    it('names only statement rules the grammar actually has', () => {
        // The visitor finds the rule by its name on the parse tree. A misspelt key would
        // never match, and its statement would come back as an "unrecognized statement".
        const unknown = Object.keys(unsupportedStatementRules()).filter(
            (rule) => !OpenQASM3Parser.ruleNames.includes(rule),
        );

        expect(unknown).toEqual([]);
    });

    it('lists every supported gate exactly once', () => {
        const gates = SUPPORT_MATRIX.filter((entry) => entry.kind === 'gate').map((entry) => entry.construct);
        expect(new Set(gates).size).toBe(gates.length);
    });

    it('does not claim MEASURE or DUMMY as gate calls', () => {
        // `measure` is not a gateCallStatement in the grammar, and DUMMY is a
        // drag-time placeholder that never exists in a document.
        expect(isGateSupported('MEASURE')).toBe(false);
        expect(isGateSupported('DUMMY')).toBe(false);
    });

    it('never marks a construct both supported and unsupported', () => {
        const supported = new Set(SUPPORT_MATRIX.filter((e) => e.status === 'supported').map((e) => e.construct));
        const unsupported = SUPPORT_MATRIX.filter((e) => e.status === 'unsupported').map((e) => e.construct);

        expect(unsupported.filter((construct) => supported.has(construct))).toEqual([]);
    });
});

describe('the visitor rejects what the matrix says it rejects', () => {
    // One valid OpenQASM statement per rule the matrix lists as unsupported.
    const STATEMENTS: Record<string, string> = {
        aliasDeclarationStatement: 'let a = q[0];',
        assignmentStatement: 'c = 1;',
        barrierStatement: 'barrier q;',
        boxStatement: 'box { h q[0]; }',
        breakStatement: 'break;',
        calStatement: 'cal { }',
        calibrationGrammarStatement: 'defcalgrammar "openpulse";',
        classicalDeclarationStatement: 'bit[2] c;',
        constDeclarationStatement: 'const int n = 4;',
        continueStatement: 'continue;',
        defStatement: 'def f() { }',
        defcalStatement: 'defcal x $0 { }',
        delayStatement: 'delay[100ns] q[0];',
        endStatement: 'end;',
        expressionStatement: '1 + 1;',
        externStatement: 'extern f(int) -> int;',
        forStatement: 'for int i in [0:2] { h q[0]; }',
        gateStatement: 'gate my a { h a; }',
        ifStatement: 'if (true) { h q[0]; }',
        ioDeclarationStatement: 'input int x;',
        measureArrowAssignmentStatement: 'measure q[0];',
        oldStyleDeclarationStatement: 'creg c[2];',
        pragma: 'pragma keep going',
        resetStatement: 'reset q[0];',
        returnStatement: 'return;',
        switchStatement: 'switch (1) { case 1 { } }',
        whileStatement: 'while (true) { h q[0]; }',
    };

    it('has a statement for every rule the matrix lists, and no other', () => {
        expect(Object.keys(STATEMENTS).sort()).toEqual(Object.keys(unsupportedStatementRules()).sort());
    });

    it.each(Object.entries(STATEMENTS))('rejects %s with the reason the matrix gives', (rule, statement) => {
        const result = toCircuit(`${HEADER}qubit[2] q;\n${statement}\n`);

        expect(result.syntaxErrors, 'the fixture has to be valid OpenQASM to reach the rule').toEqual([]);
        const rejection = result.unsupported.find((u) => u.construct === rule);
        expect(rejection?.message, `no rejection names ${rule}`).toContain(unsupportedStatementRules()[rule]);
        expect(isEditable(result)).toBe(false);
    });

    it('keeps support a matrix decision, not an arity one', () => {
        // DUMMY has a shape and is still not supported. It is also not OpenQASM, so this
        // rule can only be stated here. No document can reach it through a gate call.
        expect(GATE_ARITY.DUMMY).toBeDefined();
        expect(isGateSupported('DUMMY')).toBe(false);
    });

    it('calls a real gate it cannot draw unsupported', () => {
        // sdg is in stdgates.inc. That this editor has no shape for it is our limit.
        const [rejection, ...rest] = toCircuit('OPENQASM 3.0;\nqubit[1] q;\nsdg q[0];\n').unsupported;

        expect(rest).toEqual([]);
        expect(rejection).toMatchObject({ kind: 'unsupported', message: "Unsupported gate 'sdg'." });
    });

    it('calls a name OpenQASM never declares invalid, which is a different thing to say', () => {
        const [rejection, ...rest] = toCircuit('OPENQASM 3.0;\nqubit[1] q;\nfoo q[0];\n').unsupported;

        expect(rest).toEqual([]);
        expect(rejection).toMatchObject({ kind: 'invalid', message: "Unknown gate 'foo'." });
    });
});

describe('comments are detected, not silently dropped', () => {
    it('detects a line comment', () => {
        const result = toCircuit('OPENQASM 3.0;\nqubit[1] q;\n// my note\nh q[0];\n');
        const comment = result.unsupported.find((u) => u.construct === 'comment');

        expect(comment).toBeDefined();
        expect(comment?.line).toBe(3);
    });

    it('detects a block comment', () => {
        const result = toCircuit('OPENQASM 3.0;\nqubit[1] q;\n/* explanation */\nh q[0];\n');
        expect(result.unsupported.some((u) => u.construct === 'comment')).toBe(true);
    });

    it('detects a trailing comment on an otherwise supported line', () => {
        const result = toCircuit('OPENQASM 3.0;\nqubit[1] q;\nh q[0]; // why\n');
        expect(result.unsupported.some((u) => u.construct === 'comment')).toBe(true);
    });

    it('leaves a comment-free document editable', () => {
        const result = toCircuit('OPENQASM 3.0;\nqubit[1] q;\nh q[0];\n');
        expect(result.unsupported).toEqual([]);
    });

    it('accepts generated structural markers only at generated positions', () => {
        const result = toCircuit('OPENQASM 3.0;\n// Register q\nqubit[1] q;\n\n// Layer 1\nh q[0];\n');

        expect(isEditable(result)).toBe(true);
    });

    it('detects marker-looking comments below the header when they are not generated markers', () => {
        const result = toCircuit('OPENQASM 3.0;\nqubit[1] q;\n// Register q\nh q[0];\n');

        expect(result.unsupported).toEqual([
            expect.objectContaining({
                line: 3,
                construct: 'comment',
            }),
        ]);
    });

    it('preserves marker-looking header comments', () => {
        const result = toCircuit('// Register q\nOPENQASM 3.0;\nqubit[1] q;\n');

        expect(isEditable(result)).toBe(true);
        expect(result.preamble.headerComments).toEqual(['// Register q']);
    });

    it('keeps recognising markers after a layer that holds more than one operation', () => {
        // A marker sits above the *first* operation of its layer. Counting gate calls
        // instead of layers made every marker below a multi-operation layer look like a
        // stranger's comment, so a document QuaK had written came back read-only.
        const result = toCircuit(
            'OPENQASM 3.0;\n// Register q\nqubit[3] q;\n\n// Layer 1\nh q[0];\nx q[1];\n\n// Layer 2\ncx q[0], q[1];\n',
        );

        expect(result.unsupported).toEqual([]);
        expect(isEditable(result)).toBe(true);
    });

    it('stops recognising markers once the sequence breaks, and keeps the rest as comments', () => {
        const result = toCircuit(
            'OPENQASM 3.0;\n// Register q\nqubit[2] q;\n\n// Layer 1\nh q[0];\n\n// Layer 7\nx q[1];\n',
        );

        expect(result.unsupported).toEqual([expect.objectContaining({ line: 8, construct: 'comment' })]);
    });

    it('detects layer markers with the wrong generated number', () => {
        const result = toCircuit('OPENQASM 3.0;\nqubit[1] q;\n// Layer 99\nh q[0];\n');

        expect(result.unsupported).toEqual([
            expect.objectContaining({
                line: 3,
                construct: 'comment',
            }),
        ]);
    });
});
