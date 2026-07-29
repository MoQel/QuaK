import { describe, expect, it } from 'vitest';
import { isEditable, toCircuit } from './toCircuit.ts';
import { formatAngle, toQasm } from './toQasm.ts';

const roundTrip = (source: string) => {
    const parsed = toCircuit(source);
    expect(isEditable(parsed), `fixture is not editable: ${JSON.stringify(parsed.unsupported)}`).toBe(true);
    return toQasm(parsed.content!, parsed.preamble);
};

describe('toQasm — emission', () => {
    it('writes a valid standalone document, header included', () => {
        const parsed = toCircuit('OPENQASM 3.0;\ninclude "stdgates.inc";\nqubit[2] q;\nh q[0];\n');

        expect(toQasm(parsed.content!, parsed.preamble)).toBe(
            'OPENQASM 3.0;\ninclude "stdgates.inc";\n\nqubit[2] q;\n\nh q[0];\n',
        );
    });

    it('supplies a header when the source had none, so the output still parses', () => {
        const parsed = toCircuit('qubit[1] q;\nh q[0];\n');
        const emitted = toQasm(parsed.content!);

        expect(emitted).toContain('OPENQASM 3.0;');
        expect(emitted).toContain('include "stdgates.inc";');
        expect(isEditable(toCircuit(emitted))).toBe(true);
    });

    it('emits no comments — they would make its own output read-only', () => {
        const parsed = toCircuit('OPENQASM 3.0;\nqubit[2] q;\nh q[0];\ncx q[0], q[1];\n');
        const emitted = toQasm(parsed.content!, parsed.preamble);

        expect(emitted).not.toContain('//');
        expect(isEditable(toCircuit(emitted))).toBe(true);
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
