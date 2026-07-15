import { describe, expect, it } from 'vitest';
import { ElementaryQuantumGateDto, RegisterResponse } from '@/api/dto/circuit.ts';
import { doSpansOverlap, getOperationSpan, toGlobalQubitIndex } from './spans.ts';

/** Register layout of the ripple-carry adder: wires cin[0]=0, a[0..3]=1..4, b[0..3]=5..8, cout[0]=9. */
const adderRegisters: RegisterResponse[] = [
    { id: 'r-cin', name: 'cin', type: 'Quantum_Register', numberOfQubits: 1 },
    { id: 'r-a', name: 'a', type: 'Quantum_Register', numberOfQubits: 4 },
    { id: 'r-b', name: 'b', type: 'Quantum_Register', numberOfQubits: 4 },
    { id: 'r-cout', name: 'cout', type: 'Quantum_Register', numberOfQubits: 1 },
];

const gate = (
    identifier: 'X' | 'CX',
    targets: [string, number][],
    controls: [string, number][] = [],
): ElementaryQuantumGateDto => ({
    id: `${identifier}-${targets.map(([r, i]) => `${r}${i}`).join('')}`,
    type: 'ELEMENTARY_QUANTUM_GATE',
    identifier,
    inverseForm: false,
    targetQubits: targets.map(([registerId, index]) => ({ registerId, index })),
    controlQubits: controls.map(([registerId, index]) => ({ registerId, index })),
    rotationAngle: 0,
});

const overlaps = (a: ElementaryQuantumGateDto, b: ElementaryQuantumGateDto) =>
    doSpansOverlap(getOperationSpan(adderRegisters, a), getOperationSpan(adderRegisters, b));

describe('toGlobalQubitIndex', () => {
    it('offsets register-local indices by the preceding registers', () => {
        expect(toGlobalQubitIndex(adderRegisters, { registerId: 'r-cin', index: 0 })).toBe(0);
        expect(toGlobalQubitIndex(adderRegisters, { registerId: 'r-a', index: 0 })).toBe(1);
        expect(toGlobalQubitIndex(adderRegisters, { registerId: 'r-a', index: 3 })).toBe(4);
        expect(toGlobalQubitIndex(adderRegisters, { registerId: 'r-b', index: 0 })).toBe(5);
        expect(toGlobalQubitIndex(adderRegisters, { registerId: 'r-cout', index: 0 })).toBe(9);
    });

    it('is the identity for a single register', () => {
        const single: RegisterResponse[] = [{ id: 'q', name: 'q', type: 'Quantum_Register', numberOfQubits: 4 }];
        expect(toGlobalQubitIndex(single, { registerId: 'q', index: 2 })).toBe(2);
    });
});

describe('getOperationSpan', () => {
    it('spans the global wires a multi-qubit gate reaches across registers', () => {
        // cx a[0], b[0] reaches from wire 1 down to wire 5, not "index 0".
        expect(getOperationSpan(adderRegisters, gate('CX', [['r-b', 0]], [['r-a', 0]]))).toEqual({ min: 1, max: 5 });
    });
});

describe('span overlap in multi-register circuits', () => {
    it('does not report a collision for the same local index in different registers', () => {
        // Regression: a[0] and b[0] both have local index 0 but sit on wires 1 and 5. Scheduling on
        // the local index pushed them into separate columns although they never touch.
        expect(overlaps(gate('X', [['r-a', 0]]), gate('X', [['r-b', 0]]))).toBe(false);
    });

    it('keeps all four X gates of the adder input state in one column', () => {
        const inputState = [
            gate('X', [['r-a', 0]]),
            gate('X', [['r-b', 0]]),
            gate('X', [['r-b', 1]]),
            gate('X', [['r-b', 2]]),
            gate('X', [['r-b', 3]]),
        ];
        for (const a of inputState) {
            for (const b of inputState) {
                if (a !== b) expect(overlaps(a, b)).toBe(false);
            }
        }
    });

    it('reports a collision for a gate inside a multi-qubit gate vertical reach', () => {
        // Regression: a[2] (wire 3) lies inside the reach of cx a[0], b[0] (wires 1..5), so it must
        // not share a column — otherwise the X is drawn across the CX connector line.
        expect(overlaps(gate('X', [['r-a', 2]]), gate('CX', [['r-b', 0]], [['r-a', 0]]))).toBe(true);
    });

    it('keeps the crossing cx a[i], b[i] chain in separate columns', () => {
        // Regression: these have disjoint local spans ({1,1}, {2,2}, {3,3}) but their global reaches
        // ([2,6], [3,7], [4,8]) all overlap, so stacking them in one column drew the connector lines
        // on top of each other.
        const chain = [
            gate('CX', [['r-b', 1]], [['r-a', 1]]),
            gate('CX', [['r-b', 2]], [['r-a', 2]]),
            gate('CX', [['r-b', 3]], [['r-a', 3]]),
        ];
        for (const a of chain) {
            for (const b of chain) {
                if (a !== b) expect(overlaps(a, b)).toBe(true);
            }
        }
    });
});
