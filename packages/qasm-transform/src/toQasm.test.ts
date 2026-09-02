import { describe, expect, it } from 'vitest';
import type { CircuitContent, OperationIdentifier } from '@quak/circuit-core';
import { isEditable, toCircuit } from './toCircuit.ts';
import { formatAngle, toQasm } from './toQasm.ts';
import { circuitOf, HEADER, parseEditable } from './testFixtures.ts';

const roundTrip = (source: string) => {
    const parsed = parseEditable(source);
    return toQasm(parsed.content, parsed.preamble);
};

// The editor packs independent operations into one layer, so this is the normal
// shape of a saved circuit, not an edge case.
const TWO_LAYERS_THREE_GATES =
    `${HEADER}\n// Register q\nqubit[3] q;\n\n` + '// Layer 1\nh q[0];\nx q[1];\n\n// Layer 2\ncx q[0], q[1];\n';

describe('toQasm: emission', () => {
    it('writes a valid standalone document, header and markers included', () => {
        const parsed = parseEditable(`${HEADER}qubit[2] q;\nh q[0];\n`);

        expect(toQasm(parsed.content, parsed.preamble)).toBe(
            'OPENQASM 3.0;\ninclude "stdgates.inc";\n\n// Register q\nqubit[2] q;\n\n// Layer 1\nh q[0];\n',
        );
    });

    it('supplies a header when the source had none, so the output still parses', () => {
        const emitted = toQasm(circuitOf('qubit[1] q;\nh q[0];\n'));

        expect(emitted).toContain('OPENQASM 3.0;');
        expect(emitted).toContain('include "stdgates.inc";');
        expect(isEditable(toCircuit(emitted))).toBe(true);
    });

    // Generated markers must not make generated files read-only.
    it('emits structural markers without making its own output read-only', () => {
        const emitted = roundTrip('OPENQASM 3.0;\nqubit[2] q;\nh q[0];\ncx q[0], q[1];\n');

        expect(emitted).toContain('// Register q');
        expect(emitted).toContain('// Layer 1');

        const reparsed = toCircuit(emitted);
        expect(reparsed.unsupported).toEqual([]);
        expect(isEditable(reparsed)).toBe(true);
    });

    it('preserves the header comment block, above everything else', () => {
        const source = '// Copyright 2026 KIT\n// Bell pair demo\nOPENQASM 3.0;\nqubit[2] q;\nh q[0];\n';
        const parsed = parseEditable(source);

        expect(parsed.preamble.headerComments).toEqual(['// Copyright 2026 KIT', '// Bell pair demo']);
        expect(toQasm(parsed.content, parsed.preamble)).toMatch(/^\/\/ Copyright 2026 KIT\n\/\/ Bell pair demo\n\n/);
    });

    it('keeps a document with comments below the header read-only', () => {
        const parsed = toCircuit('OPENQASM 3.0;\nqubit[2] q;\n// prepare the state\nh q[0];\n');

        expect(isEditable(parsed)).toBe(false);
        expect(parsed.unsupported.map((u) => u.construct)).toEqual(['comment']);
    });

    it('writes controls before targets', () => {
        expect(roundTrip('OPENQASM 3.0;\nqubit[3] q;\nccx q[0], q[1], q[2];\n')).toContain('ccx q[0], q[1], q[2];');
    });

    it('drops the drag placeholder rather than emitting it', () => {
        const emitted = toQasm({
            registers: [{ id: 'r', name: 'q', type: 'Quantum_Register', numberOfQubits: 1 }],
            layers: [
                {
                    quantumOperations: [
                        {
                            id: 'd',
                            type: 'DUMMY',
                            identifier: 'DUMMY',
                            inverseForm: false,
                            targetQubits: [{ registerId: 'r', index: 0 }],
                            controlQubits: [],
                        },
                    ],
                },
            ],
        });

        expect(emitted).not.toContain('dummy');
    });
});

// Editor-created DTOs may carry default angles on gates that are not parametric.
describe('what toQasm writes, toCircuit has to accept again', () => {
    it('round trips a circuit whose layers hold more than one operation', () => {
        const reread = toCircuit(roundTrip(TWO_LAYERS_THREE_GATES));

        expect(reread.unsupported, 'QuaK flagged its own output').toEqual([]);
        expect(isEditable(reread)).toBe(true);
    });

    it('leaves a file of its own byte for byte alone', () => {
        // Anything less rewrites the user's file on an edit that changed nothing else.
        expect(roundTrip(TWO_LAYERS_THREE_GATES)).toBe(TWO_LAYERS_THREE_GATES);
    });
});

describe('circuits built by the editor, not by the parser', () => {
    const gateDroppedByEditor = (identifier: OperationIdentifier, rotationAngle: number): CircuitContent => ({
        registers: [{ id: 'r', name: 'q', type: 'Quantum_Register' as const, numberOfQubits: 1 }],
        layers: [
            {
                quantumOperations: [
                    {
                        id: 'op',
                        type: 'ELEMENTARY_QUANTUM_GATE' as const,
                        identifier,
                        inverseForm: false,
                        targetQubits: [{ registerId: 'r', index: 0 }],
                        controlQubits: [],
                        rotationAngle,
                    },
                ],
            },
        ],
    });

    it.each(['X', 'H', 'Z', 'S', 'T'] as const)(
        'never writes a parameter on %s, whatever angle the DTO carries',
        (identifier) => {
            const emitted = toQasm(gateDroppedByEditor(identifier, Math.PI / 2));

            expect(emitted).not.toMatch(/\w+\(/);
            expect(isEditable(toCircuit(emitted))).toBe(true);
        },
    );

    it.each(['RX', 'RY', 'RZ'] as const)('does write the parameter on %s', (identifier) => {
        expect(toQasm(gateDroppedByEditor(identifier, Math.PI / 2))).toContain(`${identifier.toLowerCase()}(pi/2)`);
    });

    it('writes rx(0) rather than dropping the angle, so the round trip stays exact', () => {
        const emitted = toQasm(gateDroppedByEditor('RX', 0));

        expect(emitted).toContain('rx(0)');
        expect(isEditable(toCircuit(emitted))).toBe(true);
    });

    it('never emits a modifier the parser refuses, whatever the DTO claims', () => {
        const inverse = gateDroppedByEditor('S', 0);
        inverse.layers[0].quantumOperations[0].inverseForm = true;

        const emitted = toQasm(inverse);

        expect(emitted).not.toContain('inv');
        expect(isEditable(toCircuit(emitted))).toBe(true);
    });

    it('numbers layer markers contiguously across an empty layer', () => {
        const content = gateDroppedByEditor('H', 0);
        content.layers.push({ quantumOperations: [] }, gateDroppedByEditor('X', 0).layers[0]);

        const emitted = toQasm(content);

        expect(emitted).toContain('// Layer 1');
        expect(emitted).toContain('// Layer 2');
        expect(emitted).not.toContain('// Layer 3');
    });
});

describe('formatAngle: symbolic, so round trips do not decay', () => {
    it.each([
        [Math.PI, 'pi'],
        [Math.PI / 2, 'pi/2'],
        [-Math.PI / 4, '-pi/4'],
        [(2 * Math.PI) / 3, '2*pi/3'],
        [2 * Math.PI, 'tau'],
        [Math.E, 'euler'],
        [0, '0'],
        [0.5, '0.5'],
    ])('formats %s as %s', (angle, expected) => {
        expect(formatAngle(angle)).toBe(expected);
    });

    // Writing `rx(0)` for an angle nobody chose would put a different circuit into the
    // user's file without a word. Refusing lets the host reject the edit instead.
    it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
        'refuses to write %s rather than silently writing 0',
        (angle) => {
            expect(() => formatAngle(angle)).toThrow(/non-finite/);
        },
    );
});

describe('round trip is idempotent', () => {
    const fixtures: Record<string, string> = {
        'single gate': `${HEADER}qubit[1] q;\nh q[0];\n`,
        'bell pair': `${HEADER}qubit[2] q;\nh q[0];\ncx q[0], q[1];\n`,
        toffoli: `${HEADER}qubit[3] q;\nccx q[0], q[1], q[2];\n`,
        swap: `${HEADER}qubit[2] q;\nswap q[0], q[1];\n`,
        rotations: `${HEADER}qubit[1] q;\nrx(pi/2) q[0];\nry(tau) q[0];\nrz(-pi/4) q[0];\n`,
        'multiple registers': `${HEADER}qubit[2] a;\nqubit[1] b;\nh a[0];\ncx a[1], b[0];\n`,
    };

    it.each(Object.entries(fixtures))('%s survives generate → parse → generate unchanged', (_name, source) => {
        const once = roundTrip(source);
        const twice = roundTrip(once);

        expect(twice).toBe(once);
    });

    it.each(Object.entries(fixtures))('%s keeps its circuit through the round trip', (_name, source) => {
        const before = circuitOf(source);
        const after = circuitOf(roundTrip(source));

        // Ids are position-derived, so regenerating moves them. The circuit itself must not change.
        expect(stripIds(after)).toEqual(stripIds(before));
    });

    it('round-trips a file the web IDE generated, markers and all', () => {
        const webIdeStyle = '// Register q\nqubit[2] q;\n\n// Layer 1\nh q[0];\n\n// Layer 2\ncx q[0], q[1];\n';
        expect(isEditable(toCircuit(roundTrip(webIdeStyle)))).toBe(true);
    });

    it('preserves the angle exactly, not just approximately', () => {
        const operation = circuitOf(roundTrip('OPENQASM 3.0;\nqubit[1] q;\nrx(2*pi/3) q[0];\n')).layers[0]
            .quantumOperations[0];

        expect('rotationAngle' in operation && operation.rotationAngle).toBeCloseTo((2 * Math.PI) / 3, 12);
    });
});

const stripIds = (content: CircuitContent) => ({
    registers: content.registers.map(({ id: _id, ...rest }) => rest),
    layers: content.layers.map((layer) => ({
        quantumOperations: layer.quantumOperations.map(({ id: _id, ...rest }) => rest),
    })),
});
