import { describe, it, expect } from 'vitest';
import { toLabeledDirac } from './labeledMapper.ts';
import {
    CircuitResponse,
    ElementaryQuantumGateDto,
    ElementSelectorDto,
    LayerResponse,
    QuantumOperationDto,
    QuantumRegisterResponse,
} from '@/api/dto/circuit.ts';

const quantumRegister = (id: string, numberOfQubits: number, name = id): QuantumRegisterResponse => ({
    id,
    name,
    type: 'Quantum_Register',
    numberOfQubits,
});

const sel = (registerId: string, index: number): ElementSelectorDto => ({ registerId, index });

const gate = (
    identifier: string,
    targetQubits: ElementSelectorDto[],
    controlQubits: ElementSelectorDto[] = [],
    overrides: Partial<ElementaryQuantumGateDto> = {},
): ElementaryQuantumGateDto => ({
    type: 'ELEMENTARY_QUANTUM_GATE',
    identifier: identifier as ElementaryQuantumGateDto['identifier'],
    inverseForm: false,
    targetQubits,
    controlQubits,
    rotationAngle: 0,
    ...overrides,
});

const layer = (...ops: QuantumOperationDto[]): LayerResponse => ({ quantumOperations: ops });

const circuit = (registers: QuantumRegisterResponse[], layers: LayerResponse[]): CircuitResponse => ({
    id: 'test-circuit',
    registers,
    layers,
});

describe('toLabeledDirac', () => {
    it('renders a single-qubit gate composed with a labelled ket', () => {
        // H(q0)
        const result = toLabeledDirac(circuit([quantumRegister('q', 1)], [layer(gate('H', [sel('q', 0)]))]));

        expect(result).toBe(String.raw`\mathrm{H}_{q_{0}} \cdot \lvert 0\rangle_{q_{0}}`);
    });

    it('renders the H; CNOT example (last-applied gate leftmost, \\cdot composition)', () => {
        // H(q0); CNOT(q0, q1)
        const result = toLabeledDirac(
            circuit(
                [quantumRegister('q', 2)],
                [layer(gate('H', [sel('q', 0)])), layer(gate('CX', [sel('q', 1)], [sel('q', 0)]))],
            ),
        );

        expect(result).toBe(
            String.raw`\mathrm{CNOT}_{q_{0} q_{1}} \cdot \mathrm{H}_{q_{0}} \cdot \lvert 00\rangle_{q_{0} q_{1}}`,
        );
    });

    it('preserves gate-local operand order (control=q1, target=q0 stays q_1 q_0)', () => {
        // CNOT(control=q1, target=q0) — must NOT be reordered to q_0 q_1.
        const cnot = gate('CX', [sel('q', 0)], [sel('q', 1)]);

        const result = toLabeledDirac(circuit([quantumRegister('q', 2)], [layer(cnot)]));

        expect(result).toBe(String.raw`\mathrm{CNOT}_{q_{1} q_{0}} \cdot \lvert 00\rangle_{q_{0} q_{1}}`);
    });

    it('renders the CCNOT example with space-separated operand labels', () => {
        // CCNOT with controls q0, q2 and target q1 — the Toffoli from the motivating example.
        const ccnot = gate('CCX', [sel('q', 1)], [sel('q', 0), sel('q', 2)]);

        const result = toLabeledDirac(circuit([quantumRegister('q', 3)], [layer(ccnot)]));

        expect(result).toBe(String.raw`\mathrm{CCNOT}_{q_{0} q_{2} q_{1}} \cdot \lvert 000\rangle_{q_{0} q_{1} q_{2}}`);
    });

    it('renders a rotation gate with an upright braced axis and \\!\\left parentheses', () => {
        // RZ(pi/2) on q1 of a two-qubit register.
        const result = toLabeledDirac(
            circuit([quantumRegister('q', 2)], [layer(gate('RZ', [sel('q', 1)], [], { rotationAngle: Math.PI / 2 }))]),
        );

        expect(result).toBe(
            String.raw`\mathrm{R}_{z}\!\left(\frac{\pi}{2}\right)_{q_{1}} \cdot \lvert 00\rangle_{q_{0} q_{1}}`,
        );
    });

    it('marks an inverse gate with a dagger before the qubit subscript', () => {
        // T†(q0)
        const result = toLabeledDirac(
            circuit([quantumRegister('q', 1)], [layer(gate('T', [sel('q', 0)], [], { inverseForm: true }))]),
        );

        expect(result).toBe(String.raw`\mathrm{T}^{\dagger}_{q_{0}} \cdot \lvert 0\rangle_{q_{0}}`);
    });

    it('places the dagger before the angle on an inverse rotation', () => {
        // RZ(pi/2)†(q0)
        const result = toLabeledDirac(
            circuit(
                [quantumRegister('q', 1)],
                [layer(gate('RZ', [sel('q', 0)], [], { rotationAngle: Math.PI / 2, inverseForm: true }))],
            ),
        );

        expect(result).toBe(
            String.raw`\mathrm{R}_{z}^{\dagger}\!\left(\frac{\pi}{2}\right)_{q_{0}} \cdot \lvert 0\rangle_{q_{0}}`,
        );
    });

    it('sets multi-character register names upright, in both operator and ket labels', () => {
        const result = toLabeledDirac(
            circuit([quantumRegister('ancilla', 1)], [layer(gate('H', [sel('ancilla', 0)]))]),
        );

        expect(result).toBe(String.raw`\mathrm{H}_{\text{ancilla}_{0}} \cdot \lvert 0\rangle_{\text{ancilla}_{0}}`);
    });

    it('escapes LaTeX-special characters in register names', () => {
        const result = toLabeledDirac(circuit([quantumRegister('q_a', 1)], [layer(gate('H', [sel('q_a', 0)]))]));

        expect(result).toBe(String.raw`\mathrm{H}_{\text{q\_a}_{0}} \cdot \lvert 0\rangle_{\text{q\_a}_{0}}`);
    });

    it('skips non-unitary operations such as measurements', () => {
        const measurement: QuantumOperationDto = {
            type: 'MEASUREMENT',
            identifier: 'MEASURE',
            inverseForm: false,
            targetQubits: [sel('q', 0)],
            controlQubits: [],
            classicBits: [],
        };

        const result = toLabeledDirac(circuit([quantumRegister('q', 1)], [layer(measurement)]));

        // Only the labelled initial state remains; no operator was rendered.
        expect(result).toBe(String.raw`\lvert 0\rangle_{q_{0}}`);
    });

    it('breaks per layer in the layered layout', () => {
        // H(q0); CNOT(q0, q1) — two layers, wrapped and broken onto separate lines.
        const result = toLabeledDirac(
            circuit(
                [quantumRegister('q', 2)],
                [layer(gate('H', [sel('q', 0)])), layer(gate('CX', [sel('q', 1)], [sel('q', 0)]))],
            ),
            'layered',
        );

        expect(result).toBe(
            [
                '\\begin{aligned}',
                String.raw`& \left(\mathrm{CNOT}_{q_{0} q_{1}}\right) \\`,
                String.raw`& \cdot \left(\mathrm{H}_{q_{0}}\right) \\`,
                String.raw`& \cdot \lvert 00\rangle_{q_{0} q_{1}}`,
                '\\end{aligned}',
            ].join('\n'),
        );
    });

    it('returns an empty string when there are no qubits', () => {
        expect(toLabeledDirac(circuit([], []))).toBe('');
    });
});
