import { describe, expect, it } from 'vitest';
import { toQuantikz } from './quantikzMapper.ts';
import type { CircuitResponse, CompositeQuantumGateDto } from '@/api/dto/circuit.ts';

const sel = (index: number) => ({ registerId: 'r1', index });

const circuitWith = (gate: CompositeQuantumGateDto): CircuitResponse => ({
    id: 'c1',
    registers: [{ id: 'r1', name: 'q', type: 'Quantum_Register', numberOfQubits: 3 }],
    layers: [{ quantumOperations: [gate] }],
});

const bell: CompositeQuantumGateDto = {
    id: 'op1',
    type: 'COMPOSITE_QUANTUM_GATE',
    identifier: 'bell',
    inverseForm: false,
    targetQubits: [sel(0), sel(1)],
    controlQubits: [],
    portLabels: ['a', 'b'],
    usedQubitPositions: [0, 1],
    body: [],
};

describe('quantikz export of user-defined gates', () => {
    /** Silently dropping the gate would export a figure of a different circuit. */
    it('exports a composite as a multi-wire box', () => {
        const latex = toQuantikz(circuitWith(bell));

        expect(latex).toContain(String.raw`\gate[2]{bell}`);
    });

    it('spans every wire between its topmost and bottommost qubit', () => {
        const latex = toQuantikz(circuitWith({ ...bell, targetQubits: [sel(0), sel(2)] }));

        expect(latex).toContain(String.raw`\gate[3]{bell}`);
    });

    it('places the box on the topmost wire regardless of parameter order', () => {
        const latex = toQuantikz(circuitWith({ ...bell, targetQubits: [sel(2), sel(0)] }));

        const rows = latex.split('\n').filter((line) => line.includes(String.raw`\lstick`));
        expect(rows[0]).toContain(String.raw`\gate[3]{bell}`);
        expect(rows[1]).not.toContain(String.raw`\gate`);
        expect(rows[2]).not.toContain(String.raw`\gate`);
    });

    it('emits a plain box for a single-qubit gate', () => {
        const latex = toQuantikz(
            circuitWith({ ...bell, targetQubits: [sel(1)], portLabels: ['a'], usedQubitPositions: [0] }),
        );

        expect(latex).toContain(String.raw`\gate{bell}`);
        expect(latex).not.toContain(String.raw`\gate[1]`);
    });

    /** Gate names come from user code, so an underscore must not break the LaTeX. */
    it('escapes special characters in the gate name', () => {
        const latex = toQuantikz(circuitWith({ ...bell, identifier: 'my_gate' }));

        expect(latex).toContain(String.raw`\gate[2]{my\_gate}`);
    });
});
