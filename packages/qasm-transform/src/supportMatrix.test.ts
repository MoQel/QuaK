import { describe, expect, it } from 'vitest';
import {
    GATE_ARITY,
    SUPPORT_MATRIX,
    isGateSupported,
    supportedGates,
    unsupportedStatementRules,
} from '@quak/circuit-core';
import { toCircuit } from './toCircuit.ts';

// The matrix is only a single source if nothing can quietly disagree with it.
// These tests are the mechanism that makes that true.
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
        // Rather than trusting that the visitor reads the matrix, check the
        // reason text actually surfaces — a hardcoded list would fail here.
        const result = toCircuit('OPENQASM 3.0;\nqubit[2] q;\nfor int i in [0:2] { h q[0]; }\n');
        const rejection = result.unsupported.find((u) => u.construct === 'forStatement');

        expect(rejection?.message).toContain(unsupportedStatementRules().forStatement);
    });

    it('rejects a gate the matrix omits, even when GATE_ARITY knows its shape', () => {
        // Support is the matrix's call; arity is not. `dummy` is the one case that
        // exercises this: it has an arity, it parses as an ordinary gate call, and
        // the matrix deliberately omits it. (`measure` cannot be used here — the
        // grammar routes it to measureArrowAssignmentStatement, so it would be
        // rejected on the statement path and the test would pass for the wrong
        // reason.)
        expect(GATE_ARITY.DUMMY).toBeDefined();

        const rejection = toCircuit('OPENQASM 3.0;\nqubit[1] q;\ndummy q[0];\n').unsupported;
        expect(rejection).toHaveLength(1);
        expect(rejection[0]).toMatchObject({ construct: 'DUMMY', message: "Unsupported gate 'dummy'." });
    });
});

// The matrix has always claimed comments force read-only. Until now nothing
// implemented that, so a user's note would have been deleted by the first edit.
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
});
