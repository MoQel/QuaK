import { describe, expect, it } from 'vitest';
import type { CircuitContent, OperationIdentifier } from '@quak/circuit-core';
import { isEditable, toCircuit } from './toCircuit.ts';
import { formatAngle, toQasm } from './toQasm.ts';

const roundTrip = (source: string) => {
    const parsed = toCircuit(source);
    expect(isEditable(parsed), `fixture is not editable: ${JSON.stringify(parsed.unsupported)}`).toBe(true);
    return toQasm(parsed.content!, parsed.preamble);
};

describe('toQasm — emission', () => {
    it('writes a valid standalone document, header and markers included', () => {
        const parsed = toCircuit('OPENQASM 3.0;\ninclude "stdgates.inc";\nqubit[2] q;\nh q[0];\n');

        expect(toQasm(parsed.content!, parsed.preamble)).toBe(
            'OPENQASM 3.0;\ninclude "stdgates.inc";\n\n// Register q\nqubit[2] q;\n\n// Layer 1\nh q[0];\n',
        );
    });

    it('supplies a header when the source had none, so the output still parses', () => {
        const parsed = toCircuit('qubit[1] q;\nh q[0];\n');
        const emitted = toQasm(parsed.content!);

        expect(emitted).toContain('OPENQASM 3.0;');
        expect(emitted).toContain('include "stdgates.inc";');
        expect(isEditable(toCircuit(emitted))).toBe(true);
    });

    // The load-bearing property of the marker design: the generator annotates its
    // output, and that output is still editable. If markers counted as content,
    // writing the file would make it read-only the instant we wrote it.
    it('emits structural markers without making its own output read-only', () => {
        const parsed = toCircuit('OPENQASM 3.0;\nqubit[2] q;\nh q[0];\ncx q[0], q[1];\n');
        const emitted = toQasm(parsed.content!, parsed.preamble);

        expect(emitted).toContain('// Register q');
        expect(emitted).toContain('// Layer 1');

        const reparsed = toCircuit(emitted);
        expect(reparsed.unsupported).toEqual([]);
        expect(isEditable(reparsed)).toBe(true);
    });

    it('preserves the header comment block, above everything else', () => {
        const source = '// Copyright 2026 KIT\n// Bell pair demo\nOPENQASM 3.0;\nqubit[2] q;\nh q[0];\n';
        const parsed = toCircuit(source);

        expect(isEditable(parsed)).toBe(true);
        expect(parsed.preamble.headerComments).toEqual(['// Copyright 2026 KIT', '// Bell pair demo']);
        expect(toQasm(parsed.content!, parsed.preamble)).toMatch(/^\/\/ Copyright 2026 KIT\n\/\/ Bell pair demo\n\n/);
    });

    it('keeps a document with comments below the header read-only', () => {
        // The honest half of the deal: those cannot be re-anchored, so the user is
        // told before editing rather than after their comments are gone.
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

// Circuits reach the generator from two places, and they do not look alike. The
// fixtures above all came from parsing, where a non-rotation gate has no angle.
// The editor is the other producer, and it stamps a default angle on everything
// it creates — which is how `x(pi/2)` got written to a real file.
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
});

describe('formatAngle — symbolic, so round trips do not decay', () => {
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

    it('never emits a non-QASM token for a non-finite angle', () => {
        expect(formatAngle(Number.NaN)).toBe('0');
        expect(formatAngle(Number.POSITIVE_INFINITY)).toBe('0');
    });
});

// The contract that matters (D8): what comes back must mean the same thing.
describe('round trip is idempotent', () => {
    const fixtures: Record<string, string> = {
        'single gate': 'OPENQASM 3.0;\ninclude "stdgates.inc";\nqubit[1] q;\nh q[0];\n',
        'bell pair': 'OPENQASM 3.0;\ninclude "stdgates.inc";\nqubit[2] q;\nh q[0];\ncx q[0], q[1];\n',
        toffoli: 'OPENQASM 3.0;\ninclude "stdgates.inc";\nqubit[3] q;\nccx q[0], q[1], q[2];\n',
        swap: 'OPENQASM 3.0;\ninclude "stdgates.inc";\nqubit[2] q;\nswap q[0], q[1];\n',
        rotations:
            'OPENQASM 3.0;\ninclude "stdgates.inc";\nqubit[1] q;\nrx(pi/2) q[0];\nry(tau) q[0];\nrz(-pi/4) q[0];\n',
        'multiple registers':
            'OPENQASM 3.0;\ninclude "stdgates.inc";\nqubit[2] a;\nqubit[1] b;\nh a[0];\ncx a[1], b[0];\n',
    };

    it.each(Object.entries(fixtures))('%s survives generate → parse → generate unchanged', (_name, source) => {
        const once = roundTrip(source);
        const twice = roundTrip(once);

        expect(twice).toBe(once);
    });

    it.each(Object.entries(fixtures))('%s keeps its circuit through the round trip', (_name, source) => {
        const before = toCircuit(source).content;
        const after = toCircuit(roundTrip(source)).content;

        // Ids are position-derived, so regenerating moves them; the circuit itself must not change.
        expect(stripIds(after)).toEqual(stripIds(before));
    });

    it('round-trips a file the web IDE generated, markers and all', () => {
        // The interop case: the Java generator annotates its output the same way.
        // If markers were treated as content this would be read-only on arrival.
        const webIdeStyle = '// Register q\nqubit[2] q;\n\n// Layer 1\nh q[0];\n\n// Layer 2\ncx q[0], q[1];\n';
        const parsed = toCircuit(webIdeStyle);

        expect(isEditable(parsed)).toBe(true);
        expect(isEditable(toCircuit(toQasm(parsed.content!, parsed.preamble)))).toBe(true);
    });

    it('preserves the angle exactly, not just approximately', () => {
        const parsed = toCircuit(roundTrip('OPENQASM 3.0;\nqubit[1] q;\nrx(2*pi/3) q[0];\n'));
        const operation = parsed.content!.layers[0].quantumOperations[0];

        expect('rotationAngle' in operation && operation.rotationAngle).toBeCloseTo((2 * Math.PI) / 3, 12);
    });
});

const stripIds = (content: ReturnType<typeof toCircuit>['content']) => ({
    registers: content!.registers.map(({ id: _id, ...rest }) => rest),
    layers: content!.layers.map((layer) => ({
        quantumOperations: layer.quantumOperations.map(({ id: _id, ...rest }) => rest),
    })),
});
