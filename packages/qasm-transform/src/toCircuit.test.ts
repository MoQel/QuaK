import { describe, expect, it } from 'vitest';
import { isQuantumRegister, type ElementaryQuantumGateDto } from '@quak/circuit-core';
import { classify, isEditable, toCircuit } from './toCircuit.ts';
import { circuitOf, HEADER } from './testFixtures.ts';

/** Size of the first qubit register; narrows for assertions. */
const qubitsIn = (source: string): number => circuitOf(source).registers.filter(isQuantumRegister)[0].numberOfQubits;

describe('toCircuit: registers', () => {
    it('reads a sized qubit declaration', () => {
        const { registers } = circuitOf(`${HEADER}qubit[3] q;\n`);
        expect(registers).toEqual([{ id: 'qreg:q', name: 'q', type: 'Quantum_Register', numberOfQubits: 3 }]);
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

    it('does not name a register after the token ANTLR invents for a missing one', () => {
        const result = toCircuit(`${HEADER}qubit ;\n`);

        expect(result.content).toBeNull();
        expect(result.unsupported[0].message).toBe('This qubit register has no name.');
    });

    it('rejects a non-constant register size instead of guessing', () => {
        const result = toCircuit(`${HEADER}const int n = 4;\nqubit[n] q;\n`);
        expect(result.unsupported.map((u) => u.construct)).toContain('qubitType');
    });
});

describe('toCircuit: classical registers', () => {
    it.each([
        ['bit[n] c;', 'bit[3] c;'],
        ['creg c[n];', 'creg c[3];'],
    ])('reads %s as a classical register', (_form, declaration) => {
        const { registers } = circuitOf(`${HEADER}qubit[1] q;\n${declaration}\n`);

        expect(registers).toEqual([
            { id: 'qreg:q', name: 'q', type: 'Quantum_Register', numberOfQubits: 1 },
            { id: 'creg:c', name: 'c', type: 'Classic_Register', numberOfBits: 3 },
        ]);
    });

    it.each(['bit c;', 'creg c;'])('treats %s without a size as a single bit', (declaration) => {
        const { registers } = circuitOf(`${HEADER}qubit[1] q;\n${declaration}\n`);

        expect(registers[1]).toMatchObject({ type: 'Classic_Register', numberOfBits: 1 });
    });

    it('reads qreg as a qubit register, as the backend does', () => {
        expect(qubitsIn(`${HEADER}qreg q[2];\n`)).toBe(2);
    });

    it('keeps the declaration order across both kinds', () => {
        const { registers } = circuitOf(`${HEADER}bit[1] c;\nqubit[1] q;\ncreg d[2];\n`);

        expect(registers.map((register) => register.name)).toEqual(['c', 'q', 'd']);
    });

    it.each([
        ['twice', 'bit[2] c;\nbit[4] c;', /classical register 'c' is declared more than once/],
        ['once per kind', 'bit[2] q;', /'q' is already declared as a qubit register/],
    ])('rejects a name declared %s instead of resizing it', (_case, declarations, message) => {
        const result = toCircuit(`${HEADER}qubit[2] q;\n${declarations}\n`);

        expect(result.unsupported[0]).toMatchObject({ kind: 'invalid', message: expect.stringMatching(message) });
        expect(isEditable(result)).toBe(false);
    });

    it.each(['bit[0] c;', 'bit[n] c;', 'creg c[0];'])(
        'rejects %s, whose size is no positive constant',
        (declaration) => {
            const result = toCircuit(`${HEADER}qubit[1] q;\n${declaration}\n`);

            expect(result.unsupported[0].message).toMatch(/positive constant integer/);
            expect(isEditable(result)).toBe(false);
        },
    );

    it('does not count a classical register as something to draw on', () => {
        expect(classify(toCircuit(`${HEADER}bit[2] c;\n`)).kind).toBe('noRegister');
    });

    it('rejects a gate on a classical register', () => {
        const result = toCircuit(`${HEADER}qubit[1] q;\nbit[1] c;\nx c[0];\n`);

        expect(result.unsupported[0]).toMatchObject({
            kind: 'invalid',
            message: expect.stringMatching(/classical register/),
        });
    });
});

describe('toCircuit: measurements', () => {
    const DECLARED = `${HEADER}qubit[3] q;\nbit[3] c;\n`;

    /** `q[i] -> c[j]` per measurement, layer by layer. */
    const measuredIn = (source: string): string[][] =>
        circuitOf(source).layers.map((layer) =>
            layer.quantumOperations.map((operation) => {
                if (operation.type !== 'MEASUREMENT') return operation.identifier;
                const [qubit] = operation.targetQubits;
                const [bit] = operation.classicBits;
                return `${qubit.registerId}[${qubit.index}] -> ${bit.registerId}[${bit.index}]`;
            }),
        );

    it('reads the arrow form as a measurement DTO', () => {
        const [layer] = circuitOf(`${DECLARED}measure q[1] -> c[2];\n`).layers;

        expect(layer.quantumOperations).toEqual([
            {
                id: expect.any(String),
                type: 'MEASUREMENT',
                identifier: 'MEASURE',
                inverseForm: false,
                targetQubits: [{ registerId: 'qreg:q', index: 1 }],
                controlQubits: [],
                classicBits: [{ registerId: 'creg:c', index: 2 }],
            },
        ]);
    });

    it('reads the assignment form exactly like the arrow form', () => {
        const arrow = circuitOf(`${DECLARED}measure q[1] -> c[2];\n`);
        const assignment = circuitOf(`${DECLARED}c[2] = measure q[1];\n`);

        expect(assignment).toEqual(arrow);
    });

    it.each([
        ['arrow', 'measure q -> c;'],
        ['assignment', 'c = measure q;'],
    ])(
        'broadcasts the %s form over whole registers, pairing position by position, in one layer',
        (_form, statement) => {
            expect(measuredIn(`${DECLARED}${statement}\n`)).toEqual([
                ['qreg:q[0] -> creg:c[0]', 'qreg:q[1] -> creg:c[1]', 'qreg:q[2] -> creg:c[2]'],
            ]);
        },
    );

    it('expands a slice per bit, as the backend does', () => {
        const source = `${HEADER}qubit[4] b;\nbit[5] ans;\nmeasure b[0:3] -> ans[1:4];\n`;

        expect(measuredIn(source)[0]).toEqual([
            'qreg:b[0] -> creg:ans[1]',
            'qreg:b[1] -> creg:ans[2]',
            'qreg:b[2] -> creg:ans[3]',
            'qreg:b[3] -> creg:ans[4]',
        ]);
    });

    it.each([
        ['an open end', 'measure q[1:] -> c[:1];', ['qreg:q[1] -> creg:c[0]', 'qreg:q[2] -> creg:c[1]']],
        ['a step', 'measure q[0:2:2] -> c[2:-2:0];', ['qreg:q[0] -> creg:c[2]', 'qreg:q[2] -> creg:c[0]']],
        ['a single qubit against a one-bit slice', 'measure q[0] -> c[1:1];', ['qreg:q[0] -> creg:c[1]']],
    ])('reads a slice with %s', (_case, statement, expected) => {
        expect(measuredIn(`${DECLARED}${statement}\n`)[0]).toEqual(expected);
    });

    it('gives every measurement of a broadcast its own stable id', () => {
        const source = `${DECLARED}measure q -> c;\n`;
        const ids = circuitOf(source).layers[0].quantumOperations.map((operation) => operation.id);

        expect(new Set(ids).size).toBe(3);
        expect(circuitOf(source).layers[0].quantumOperations.map((operation) => operation.id)).toEqual(ids);
    });

    it('keeps measurements in source order among the gates', () => {
        expect(measuredIn(`${DECLARED}h q[0];\nmeasure q[0] -> c[0];\nx q[1];\n`)).toEqual([
            ['H'],
            ['qreg:q[0] -> creg:c[0]'],
            ['X'],
        ]);
    });

    it('rejects a measurement without a classic bit, which the circuit model cannot hold', () => {
        const result = toCircuit(`${DECLARED}measure q[0];\n`);

        expect(result.unsupported).toEqual([
            expect.objectContaining({ kind: 'unsupported', message: expect.stringMatching(/classic bit/) }),
        ]);
        expect(isEditable(result)).toBe(false);
    });

    it.each([
        ['mismatched widths', 'measure q[0:2] -> c[0:1];', /3 qubit\(s\) to 2 classic bit\(s\)/],
        ['an unknown classical register', 'measure q[0] -> d[0];', /unknown classical register 'd'/],
        ['an unknown qubit register', 'measure r[0] -> c[0];', /unknown qubit register 'r'/],
        ['a bit outside the register', 'measure q[0] -> c[3];', /outside register 'c'/],
        ['a qubit written as the target', 'measure q[0] -> q[1];', /'q', which is not a classical register/],
        ['a classical register measured', 'measure c[0] -> c[1];', /'c', which is not a qubit register/],
        ['a step of zero', 'measure q[0:0:2] -> c[0:0:2];', /step cannot be zero/],
    ])('calls %s invalid', (_case, statement, message) => {
        const result = toCircuit(`${DECLARED}${statement}\n`);

        expect(result.unsupported[0]).toMatchObject({ kind: 'invalid', message: expect.stringMatching(message) });
        expect(isEditable(result)).toBe(false);
    });

    it.each([
        ['a set', 'measure q[{0, 1}] -> c[0:1];'],
        ['a variable index', 'measure q[i] -> c[0];'],
        ['a hardware qubit', 'measure $0 -> c[0];'],
        ['a compound assignment', 'c[0] |= measure q[0];'],
    ])('rejects %s as unsupported', (_case, statement) => {
        const result = toCircuit(`${DECLARED}${statement}\n`);

        expect(result.syntaxErrors).toEqual([]);
        expect(result.unsupported[0]?.kind).toBe('unsupported');
    });
});

describe('toCircuit: gates', () => {
    it('splits operands into controls then targets, as OpenQASM orders them', () => {
        const op = circuitOf(`${HEADER}qubit[2] q;\ncx q[0], q[1];\n`).layers[0].quantumOperations[0];

        expect(op.identifier).toBe('CX');
        expect(op.controlQubits).toEqual([{ registerId: 'qreg:q', index: 0 }]);
        expect(op.targetQubits).toEqual([{ registerId: 'qreg:q', index: 1 }]);
    });

    it('gives ccx two controls and one target', () => {
        const op = circuitOf(`${HEADER}qubit[3] q;\nccx q[0], q[1], q[2];\n`).layers[0].quantumOperations[0];

        expect(op.controlQubits.map((s) => s.index)).toEqual([0, 1]);
        expect(op.targetQubits.map((s) => s.index)).toEqual([2]);
    });

    it('gives swap two targets and no control', () => {
        const op = circuitOf(`${HEADER}qubit[2] q;\nswap q[0], q[1];\n`).layers[0].quantumOperations[0];

        expect(op.controlQubits).toEqual([]);
        expect(op.targetQubits.map((s) => s.index)).toEqual([0, 1]);
    });

    it('puts each gate in its own layer, in source order', () => {
        const { layers } = circuitOf(`${HEADER}qubit[2] q;\nh q[0];\nx q[1];\nz q[0];\n`);
        expect(layers.map((l) => l.quantumOperations[0].identifier)).toEqual(['H', 'X', 'Z']);
    });

    it('reads an unindexed operand on a single-qubit register as that qubit', () => {
        const { layers } = circuitOf(`${HEADER}qubit q;\nh q;\n`);
        expect(layers[0].quantumOperations[0].targetQubits).toEqual([{ registerId: 'qreg:q', index: 0 }]);
    });

    it('rejects a gate whose operand count does not match its arity', () => {
        const result = toCircuit(`${HEADER}qubit[3] q;\ncx q[0], q[1], q[2];\n`);
        expect(result.unsupported[0].message).toMatch(/takes 2 qubits, not 3/);
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
describe('toCircuit: an operand must name exactly one qubit', () => {
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

describe('toCircuit: rotation angles', () => {
    const angleOf = (source: string) =>
        (circuitOf(`${HEADER}qubit[1] q;\n${source}\n`).layers[0].quantumOperations[0] as ElementaryQuantumGateDto)
            .rotationAngle;

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

    // Reading it as zero makes the file editable, and the next edit writes `rx(0)` into it.
    it.each(['rx q[0];', 'ry q[0];', 'rz q[0];', 'rx() q[0];'])('rejects %s instead of angling it at zero', (call) => {
        const result = toCircuit(`${HEADER}qubit[1] q;\n${call}\n`);

        expect(result.unsupported[0].message).toMatch(/takes one parameter, as in/);
        expect(isEditable(result)).toBe(false);
    });

    // Prototype keys must not resolve as named constants.
    it.each(['constructor', '__proto__', 'valueOf'])('rejects the prototype key %s as an angle', (name) => {
        const result = toCircuit(`${HEADER}qubit[1] q;\nrx(${name}) q[0];\n`);

        expect(result.unsupported[0].message).toMatch(/Could not evaluate angle expression/);
        expect(isEditable(result)).toBe(false);
    });
});

// Unsupported constructs must be detected before the extension rewrites the file.
describe('toCircuit: strictness', () => {
    it.each([
        ['control flow', 'for int i in [0:2] { h q[0]; }'],
        ['conditionals', 'if (true) { h q[0]; }'],
        ['gate definitions', 'gate mygate a { h a; }'],
        ['classical declarations other than bit registers', 'int[8] n;'],
        ['an initialized bit register', 'bit[2] c = "01";'],
        ['classical assignment', 'bit[2] c;\nc = 1;'],
        ['a measurement without a classic bit', 'measure q[0];'],
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
describe('toCircuit: preamble is preserved, not dropped', () => {
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

describe('toCircuit: stable identity across re-parses', () => {
    it('gives the same ids for the same source', () => {
        const source = `${HEADER}qubit[2] q;\nh q[0];\ncx q[0], q[1];\n`;
        const first = toCircuit(source);
        const second = toCircuit(source);

        expect(second.content).toEqual(first.content);
    });

    it('keeps ids of untouched statements when a later one is edited', () => {
        const before = circuitOf(`${HEADER}qubit[2] q;\nh q[0];\nx q[1];\n`);
        const after = circuitOf(`${HEADER}qubit[2] q;\nh q[0];\nz q[1];\n`);

        expect(after.layers[0].quantumOperations[0].id).toBe(before.layers[0].quantumOperations[0].id);
    });
});

// The reason a document is read-only is decided once, here, and only worded elsewhere.
describe('classify: the reason a document cannot be edited', () => {
    const kindOf = (source: string) => classify(toCircuit(source)).kind;

    it('reports syntax errors, and suppresses what the recovered tree makes up', () => {
        const classification = classify(toCircuit(`${HEADER}qubit[2 q;\nh q[0]\nfoo q[1];\n`));

        expect(classification).toMatchObject({ kind: 'invalid' });
        expect(classification.kind === 'invalid' && classification.problems.length).toBeGreaterThan(0);
    });

    it('names the version instead of every rejection it causes', () => {
        const classification = classify(toCircuit('OPENQASM 4.0;\ninclude "future.inc";\nfoo q[0];\n'));

        expect(classification).toMatchObject({ kind: 'unsupportedVersion', version: '4.0' });
    });

    it('reads an OpenQASM 2 file, as the backend does', () => {
        const source =
            'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\ncreg c[2];\nh q[0];\ncx q[0], q[1];\nmeasure q -> c;\n';

        expect(kindOf(source)).toBe('editable');
        expect(circuitOf(source).registers.map((register) => register.type)).toEqual([
            'Quantum_Register',
            'Classic_Register',
        ]);
    });

    it('reads an OpenQASM 2 header over an OpenQASM 3 body too, since both are written back as 3', () => {
        expect(kindOf('OPENQASM 2.0;\nqubit[2] q;\nh q[0];\n')).toBe('editable');
    });

    it.each(['OPENQASM 3;', 'OPENQASM 3.0;', 'OPENQASM 3.1;'])('accepts %s as version 3', (version) => {
        expect(kindOf(`${version}\nqubit[1] q;\n`)).toBe('editable');
    });

    it('accepts a file that omits the version header', () => {
        // The version statement is optional in the grammar.
        expect(kindOf('qubit[2] q;\nh q[0];\n')).toBe('editable');
    });

    it('names the unsupported construct rather than the register it prevented', () => {
        expect(kindOf('OPENQASM 3.0;\nqubit[n] q;\nh q[0];\n')).toBe('unsupported');
        expect(kindOf(`${HEADER}barrier;\n`)).toBe('unsupported');
    });

    it('calls a file empty only when nothing has been written yet', () => {
        expect(kindOf('')).toBe('empty');
        expect(kindOf('\n\n   \n')).toBe('empty');
    });

    it('does not call a file with content empty just because it has no register', () => {
        expect(kindOf('// hello\n')).toBe('noRegister');
        expect(kindOf('OPENQASM 3.0;\n')).toBe('noRegister');
        expect(kindOf(HEADER)).toBe('noRegister');
    });

    it('does not offer the comment opt-in when there is no circuit to unlock', () => {
        // The comment is the only rejection, but accepting its loss would change nothing.
        expect(kindOf('OPENQASM 3.0;\n// here\n')).toBe('noRegister');
    });

    it('offers the comment opt-in when only comments stand in the way', () => {
        const classification = classify(toCircuit(`${HEADER}qubit[2] q;\n// below\nh q[0];\n`));

        expect(classification).toMatchObject({ kind: 'commentsOnly', comments: [expect.anything()] });
    });

    it('keeps the comment opt-in behind constructs that cannot be opted out of', () => {
        expect(kindOf(`${HEADER}qubit[2] q;\n// below\nbarrier q;\n`)).toBe('unsupported');
    });

    it('accepts a register without any gates', () => {
        expect(kindOf(`${HEADER}qubit[4] q;\n`)).toBe('editable');
    });
});

// Every prefix of a document is a document while someone types it. A throw reaches the
// user as a defect of the extension and takes the circuit off the screen.
describe('toCircuit: a half-written document is read, not thrown at', () => {
    const TYPED: Record<string, string> = {
        'a generated circuit': `${HEADER}\n// Register q\nqubit[3] q;\n\n// Layer 1\nh q[0];\ncx q[0], q[1];\nrx(pi/2) q[2];\n`,
        'unsupported constructs': `${HEADER}qubit q;\nbit c;\nccx q[0], q[1], q[2];\nbarrier q;\n`,
        'an OpenQASM 2 file':
            'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\ncreg c[2];\nh q[0];\nmeasure q -> c;\n',
        'gate definitions and blocks':
            'qubit[2] q;\ngate my a, b { h a; cx a, b; }\nmy q[0], q[1];\nif (true) { h q[0]; }\n',
    };

    it.each(Object.entries(TYPED))('survives every prefix of %s', (_name, source) => {
        for (let length = 0; length <= source.length; length++) {
            expect(() => toCircuit(source.slice(0, length)), source.slice(0, length)).not.toThrow();
        }
    });

    it.each(Object.entries(TYPED))('survives %s with any one character deleted', (_name, source) => {
        for (let at = 0; at < source.length; at++) {
            const typo = source.slice(0, at) + source.slice(at + 1);
            expect(() => toCircuit(typo), typo).not.toThrow();
        }
    });

    // Named, so a failure points at the accessor instead of at an offset.
    it.each([
        ['a version without a number', 'OPENQASM'],
        ['an include without a closing quote', 'OPENQASM 3.0;\ninclude "x.inc;\n'],
        ['a register declaration without a name', `${HEADER}qubit[] q;\n`],
        ['a register declaration cut off at the size', `${HEADER}qubit[;\n`],
    ])('reads %s', (_name, source) => {
        expect(() => toCircuit(source)).not.toThrow();
    });

    // Whatever a broken file provokes, it is answered in words the reader can act on.
    const PARSER_INTERNALS =
        /no viable alternative|extraneous input|mismatched input|token recognition|expecting \{|<missing /;

    it.each(Object.entries(TYPED))('answers %s without quoting the parser at itself', (_name, source) => {
        for (let at = 0; at < source.length; at++) {
            const result = toCircuit(source.slice(0, at) + source.slice(at + 1));

            for (const { message } of [...result.syntaxErrors, ...result.unsupported]) {
                expect(message, message).not.toMatch(PARSER_INTERNALS);
            }
        }
    });

    // The guards keep the transform alive. The syntax error is what explains the file.
    it('never lets a guard speak for a document that parses', () => {
        const messages = [toCircuit('OPENQASM 3.0;\ninclude "x.inc;\n'), toCircuit(`${HEADER}qubit[] q;\n`)].map(
            (result) => {
                expect(result.syntaxErrors.length).toBeGreaterThan(0);
                return result.unsupported.map((entry) => entry.message);
            },
        );

        expect(messages[0]).toContain('This include names no file.');
        expect(messages[1]).toContain('This qubit register has no name.');
    });
});

// A rejection quotes the line it is about, so the excerpt has to read the way the user
// wrote it: `getText()` loses every space and picks up the tokens recovery invented.
describe('toCircuit: what a rejection quotes back', () => {
    it.each([
        ['barrier q;', 'Unsupported barrier: barrier q;'],
        ['for int i in [0:2] { h q[0]; }', 'Unsupported control flow: for int i in [0:2] { h q[0]; }'],
        ['gate my a, b { h a; }', 'Unsupported gate definitions: gate my a, b { h a; }'],
        ['h q[0][1];', 'Nested indexing is not supported: q[0][1]'],
    ])('quotes %s as written', (statement, expected) => {
        const result = toCircuit(`${HEADER}qubit[2] q;\n${statement}\n`);

        expect(result.unsupported.map((entry) => entry.message)).toContain(expected);
    });

    it('drops the token error recovery invented rather than quoting it', () => {
        // ANTLR fills the gap with a `;` of its own. The excerpt must not pick it up.
        const result = toCircuit(`${HEADER}qubit[2] q;\nbarrier q\nh q[0];\n`);

        expect(result.unsupported[0].message).toBe('Unsupported barrier: barrier q');
    });
});

// Reading each operation as a layer of its own re-wrote the file on the next save,
// turning the two layers the user had written into three.
describe('toCircuit: layers are read the way the document writes them', () => {
    // Not `circuitOf`: one case below is deliberately read-only and still has layers to check.
    const identifiersIn = (source: string) =>
        toCircuit(source).content?.layers.map((layer) => layer.quantumOperations.map((op) => op.identifier));

    const MARKED = `${HEADER}\n// Register q\nqubit[3] q;\n\n// Layer 1\nh q[0];\nx q[1];\n\n// Layer 2\ncx q[0], q[1];\n`;

    it('keeps the operations under one marker together', () => {
        expect(identifiersIn(MARKED)).toEqual([['H', 'X'], ['CX']]);
    });

    it('gives every gate a layer of its own where no marker of ours says otherwise', () => {
        // A hand-written file states no parallelism, so there is none to read out of it.
        expect(identifiersIn(`${HEADER}qubit[2] q;\nh q[0];\ncx q[0], q[1];\n`)).toEqual([['H'], ['CX']]);
    });

    it('reads measurements under a marker as one layer, like gates', () => {
        const marked = `${HEADER}\n// Register q\nqubit[2] q;\n// Register c\nbit[2] c;\n\n// Layer 1\nh q[0];\n\n// Layer 2\nmeasure q[0] -> c[0];\nc[1] = measure q[1];\n`;

        expect(toCircuit(marked).unsupported).toEqual([]);
        expect(identifiersIn(marked)).toEqual([['H'], ['MEASURE', 'MEASURE']]);
    });

    it('stops sharing layers where the marker sequence breaks', () => {
        // `// Layer 7` is not what we would have written second, so nothing below it is ours.
        const jumped = `${HEADER}\n// Register q\nqubit[2] q;\n\n// Layer 1\nh q[0];\n\n// Layer 7\nx q[1];\n`;

        expect(identifiersIn(jumped)).toEqual([['H'], ['X']]);
    });
});

// OpenQASM allows a comma after the last entry of a list. `toQasm` writes the list
// without one, so accepting it silently removed it from the file on the next save.
describe('toCircuit: a trailing comma is not ours to drop', () => {
    it.each([
        ['a single operand', 'h q[0], ;'],
        ['several operands', 'cx q[0], q[1], ;'],
        ['a gate parameter', 'rx(pi/2,) q[0];'],
    ])('rejects one after %s', (_case, statement) => {
        const result = toCircuit(`${HEADER}qubit[3] q;\n${statement}\n`);

        expect(result.syntaxErrors, 'a trailing comma is valid OpenQASM').toEqual([]);
        expect(result.unsupported[0].message).toMatch(/trailing comma/);
        expect(isEditable(result)).toBe(false);
    });

    it.each(['h q[0];', 'cx q[0], q[1];', 'ccx q[0], q[1], q[2];', 'rx(pi/2) q[0];'])(
        'counts the separating commas of %s as separators',
        (statement) => {
            expect(isEditable(toCircuit(`${HEADER}qubit[3] q;\n${statement}\n`))).toBe(true);
        },
    );
});
