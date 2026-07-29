import { describe, expect, it } from 'vitest';
import { isQuantumRegister, type ElementaryQuantumGateDto } from '@quak/circuit-core';
import { isEditable, toCircuit } from './toCircuit.ts';

/** The transform only ever produces quantum registers; narrows for assertions. */
const qubitsIn = (source: string): number =>
    toCircuit(source).content!.registers.filter(isQuantumRegister)[0].numberOfQubits;

const HEADER = 'OPENQASM 3.0;\ninclude "stdgates.inc";\n';

describe('toCircuit — registers', () => {
    it('reads a sized qubit declaration', () => {
        const { content } = toCircuit(`${HEADER}qubit[3] q;\n`);
        expect(content?.registers).toEqual([{ id: 'qreg:q', name: 'q', type: 'Quantum_Register', numberOfQubits: 3 }]);
    });

    it('treats an undesignated qubit as a single qubit', () => {
        expect(qubitsIn(`${HEADER}qubit q;\n`)).toBe(1);
    });

    it('rejects a register declared twice instead of resizing it', () => {
        // Resizing would invalidate gates already placed on the old register.
        const result = toCircuit(`${HEADER}qubit[2] q;\nqubit[5] q;\n`);

        expect(result.content?.registers).toHaveLength(1);
        expect(result.unsupported.map((u) => u.construct)).toContain('quantumDeclarationStatement');
        expect(isEditable(result)).toBe(false);
    });

    it('rejects a register size that is zero or negative', () => {
        for (const size of ['0', '-2']) {
            const result = toCircuit(`${HEADER}qubit[${size}] q;\n`);
            expect(result.unsupported.map((u) => u.construct)).toContain('qubitType');
        }
    });

    it('rejects a non-constant register size instead of guessing', () => {
        const result = toCircuit(`${HEADER}const int n = 4;\nqubit[n] q;\n`);
        expect(result.unsupported.map((u) => u.construct)).toContain('qubitType');
    });
});

describe('toCircuit — gates', () => {
    it('splits operands into controls then targets, as OpenQASM orders them', () => {
        const { content } = toCircuit(`${HEADER}qubit[2] q;\ncx q[0], q[1];\n`);
        const op = content!.layers[0].quantumOperations[0];

        expect(op.identifier).toBe('CX');
        expect(op.controlQubits).toEqual([{ registerId: 'qreg:q', index: 0 }]);
        expect(op.targetQubits).toEqual([{ registerId: 'qreg:q', index: 1 }]);
    });

    it('gives ccx two controls and one target', () => {
        const { content } = toCircuit(`${HEADER}qubit[3] q;\nccx q[0], q[1], q[2];\n`);
        const op = content!.layers[0].quantumOperations[0];

        expect(op.controlQubits.map((s) => s.index)).toEqual([0, 1]);
        expect(op.targetQubits.map((s) => s.index)).toEqual([2]);
    });

    it('gives swap two targets and no control', () => {
        const { content } = toCircuit(`${HEADER}qubit[2] q;\nswap q[0], q[1];\n`);
        const op = content!.layers[0].quantumOperations[0];

        expect(op.controlQubits).toEqual([]);
        expect(op.targetQubits.map((s) => s.index)).toEqual([0, 1]);
    });

    it('puts each gate in its own layer, in source order', () => {
        const { content } = toCircuit(`${HEADER}qubit[2] q;\nh q[0];\nx q[1];\nz q[0];\n`);
        expect(content!.layers.map((l) => l.quantumOperations[0].identifier)).toEqual(['H', 'X', 'Z']);
    });

    it('reads an unindexed operand on a single-qubit register as that qubit', () => {
        const { content } = toCircuit(`${HEADER}qubit q;\nh q;\n`);
        expect(content!.layers[0].quantumOperations[0].targetQubits).toEqual([{ registerId: 'qreg:q', index: 0 }]);
    });

    it('rejects a gate whose operand count does not match its arity', () => {
        const result = toCircuit(`${HEADER}qubit[3] q;\ncx q[0], q[1], q[2];\n`);
        expect(result.unsupported[0].message).toMatch(/expects 2 qubit\(s\) but got 3/);
    });

    it('rejects a gate the editor has no representation for', () => {
        const result = toCircuit(`${HEADER}qubit[1] q;\nsdg q[0];\n`);
        expect(result.unsupported[0].message).toMatch(/Unsupported gate 'sdg'/);
    });

    it('rejects a gate on a register that was never declared', () => {
        const result = toCircuit(`${HEADER}qubit[1] q;\nh r[0];\n`);
        expect(result.unsupported[0].message).toMatch(/unknown qubit register 'r'/);
    });
});

// Operands that name several qubits cannot be represented as one visual gate.
describe('toCircuit — an operand must name exactly one qubit', () => {
    it.each([
        ['a range', 'h q[0:1];'],
        ['a list', 'h q[0, 2];'],
        ['a set', 'h q[{0, 2}];'],
        ['nested indexing', 'h q[0][0];'],
    ])('rejects %s rather than reading its first index', (_case, statement) => {
        const result = toCircuit(`${HEADER}qubit[3] q;\n${statement}\n`);

        expect(result.unsupported.map((u) => u.construct)).toContain('indexOperator');
        expect(isEditable(result)).toBe(false);
    });

    it('rejects a broadcast over a whole multi-qubit register', () => {
        const result = toCircuit(`${HEADER}qubit[3] q;\nh q;\n`);

        expect(result.unsupported[0].message).toMatch(/all 3 qubits/);
        expect(isEditable(result)).toBe(false);
    });

    it.each([
        ['past the end', 'h q[9];'],
        ['negative', 'h q[-1];'],
    ])('rejects an index %s of the register', (_case, statement) => {
        const result = toCircuit(`${HEADER}qubit[3] q;\n${statement}\n`);

        expect(result.unsupported[0].message).toMatch(/outside register 'q' \(size 3\)/);
    });
});

describe('toCircuit — rotation angles', () => {
    const angleOf = (source: string) =>
        (
            toCircuit(`${HEADER}qubit[1] q;\n${source}\n`).content!.layers[0]
                .quantumOperations[0] as ElementaryQuantumGateDto
        ).rotationAngle;

    it('evaluates named constants and simple arithmetic', () => {
        expect(angleOf('rx(pi) q[0];')).toBeCloseTo(Math.PI, 12);
        expect(angleOf('rx(pi/2) q[0];')).toBeCloseTo(Math.PI / 2, 12);
        expect(angleOf('ry(tau) q[0];')).toBeCloseTo(2 * Math.PI, 12);
        expect(angleOf('rz(-pi/4) q[0];')).toBeCloseTo(-Math.PI / 4, 12);
        expect(angleOf('rx(2*pi/3) q[0];')).toBeCloseTo((2 * Math.PI) / 3, 12);
        expect(angleOf('rx(euler) q[0];')).toBeCloseTo(Math.E, 12);
        expect(angleOf('rx(0.5) q[0];')).toBeCloseTo(0.5, 12);
    });

    it('leaves non-parametric gates at zero', () => {
        expect(angleOf('h q[0];')).toBe(0);
    });

    it('rejects an angle it cannot evaluate rather than defaulting to zero', () => {
        const result = toCircuit(`${HEADER}qubit[1] q;\nrx(theta) q[0];\n`);
        expect(result.unsupported[0].message).toMatch(/Could not evaluate angle expression/);
    });

    it('rejects a parameter on a gate that takes none', () => {
        const result = toCircuit(`${HEADER}qubit[1] q;\nh(pi) q[0];\n`);
        expect(result.unsupported[0].message).toMatch(/does not take a parameter/);
    });

    it('rejects extra parameters rather than reading only the first', () => {
        const result = toCircuit(`${HEADER}qubit[1] q;\nrx(pi/2, pi) q[0];\n`);
        expect(result.unsupported[0].message).toMatch(/takes one parameter but got 2/);
    });

    // Prototype keys must not resolve as named constants.
    it.each(['constructor', '__proto__', 'valueOf'])('rejects the prototype key %s as an angle', (name) => {
        const result = toCircuit(`${HEADER}qubit[1] q;\nrx(${name}) q[0];\n`);

        expect(result.unsupported[0].message).toMatch(/Could not evaluate angle expression/);
        expect(isEditable(result)).toBe(false);
    });
});

// Unsupported constructs must be detected before the extension rewrites the file.
describe('toCircuit — strictness', () => {
    it.each([
        ['control flow', 'for int i in [0:2] { h q[0]; }'],
        ['conditionals', 'if (true) { h q[0]; }'],
        ['gate definitions', 'gate mygate a { h a; }'],
        ['classical declarations', 'bit[2] c;'],
        ['measurement into a register', 'c = measure q;'],
        ['reset', 'reset q[0];'],
        ['barrier', 'barrier q;'],
        ['gate modifiers', 'ctrl @ x q[0], q[1];'],
        ['hardware qubits', 'h $0;'],
    ])('detects %s rather than ignoring it', (_label, statement) => {
        const result = toCircuit(`${HEADER}qubit[2] q;\n${statement}\n`);
        expect(isEditable(result)).toBe(false);
    });

    it('accepts a document built only from supported constructs', () => {
        const result = toCircuit(`${HEADER}qubit[2] q;\nh q[0];\ncx q[0], q[1];\nrx(pi/2) q[1];\n`);
        expect(result.syntaxErrors).toEqual([]);
        expect(result.unsupported).toEqual([]);
        expect(isEditable(result)).toBe(true);
    });

    it('reports syntax errors and stays non-editable', () => {
        const result = toCircuit(`${HEADER}qubit[2 q;\n`);
        expect(result.syntaxErrors.length).toBeGreaterThan(0);
        expect(isEditable(result)).toBe(false);
    });
});

// Preamble is not circuit content, but it belongs to the user's file.
describe('toCircuit — preamble is preserved, not dropped', () => {
    it('captures the version and the includes in source order', () => {
        const result = toCircuit('OPENQASM 3.0;\ninclude "stdgates.inc";\ninclude "custom.inc";\nqubit[1] q;\n');

        expect(result.preamble.version).toBe('3.0');
        expect(result.preamble.includes).toEqual(['"stdgates.inc"', '"custom.inc"']);
    });

    it('does not treat an include as an unsupported construct', () => {
        const result = toCircuit(`${HEADER}qubit[1] q;\nh q[0];\n`);
        expect(result.unsupported).toEqual([]);
    });

    it('reports no version when the file omits it', () => {
        expect(toCircuit('qubit[1] q;\n').preamble.version).toBeNull();
    });
});

describe('toCircuit — stable identity across re-parses', () => {
    it('gives the same ids for the same source', () => {
        const source = `${HEADER}qubit[2] q;\nh q[0];\ncx q[0], q[1];\n`;
        const first = toCircuit(source);
        const second = toCircuit(source);

        expect(second.content).toEqual(first.content);
    });

    it('keeps ids of untouched statements when a later one is edited', () => {
        const before = toCircuit(`${HEADER}qubit[2] q;\nh q[0];\nx q[1];\n`);
        const after = toCircuit(`${HEADER}qubit[2] q;\nh q[0];\nz q[1];\n`);

        expect(after.content!.layers[0].quantumOperations[0].id).toBe(
            before.content!.layers[0].quantumOperations[0].id,
        );
    });
});
