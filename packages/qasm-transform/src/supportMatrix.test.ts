import { describe, expect, it } from 'vitest';
import {
    GATE_ARITY,
    SUPPORT_MATRIX,
    isGateSupported,
    supportedGates,
    unsupportedStatementRules,
} from '@quak/circuit-core';
import { isEditable, toCircuit } from './toCircuit.ts';

// The matrix is useful only if the transform cannot quietly disagree with it.
describe('support matrix is consistent with the rest of the transform', () => {
    it('claims support only for gates the editor has a shape for', () => {
        for (const gate of supportedGates()) {
            expect(GATE_ARITY[gate], `${gate} is in the matrix but has no arity`).toBeDefined();
        }
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
    it('reports the matrix note as the reason, for every unsupported statement rule', () => {
        const result = toCircuit('OPENQASM 3.0;\nqubit[2] q;\nfor int i in [0:2] { h q[0]; }\n');
        const rejection = result.unsupported.find((u) => u.construct === 'forStatement');

        expect(rejection?.message).toContain(unsupportedStatementRules().forStatement);
    });

    it('rejects a gate the matrix omits, even when GATE_ARITY knows its shape', () => {
        // Support is the matrix's call; arity alone is not enough.
        expect(GATE_ARITY.DUMMY).toBeDefined();

        const rejection = toCircuit('OPENQASM 3.0;\nqubit[1] q;\ndummy q[0];\n').unsupported;
        expect(rejection).toHaveLength(1);
        expect(rejection[0]).toMatchObject({ construct: 'DUMMY', message: "Unsupported gate 'dummy'." });
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
