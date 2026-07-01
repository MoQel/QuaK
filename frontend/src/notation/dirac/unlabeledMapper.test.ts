import { describe, it, expect } from 'vitest';
import { toUnlabeledDirac } from './unlabeledMapper.ts';
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

describe('toUnlabeledDirac', () => {
    it('renders a single-qubit gate as a tensor product with identities', () => {
        const result = toUnlabeledDirac(circuit([quantumRegister('q', 2)], [layer(gate('H', [sel('q', 0)]))]));

        expect(result).toBe(String.raw`\left(\mathrm{H} \otimes I\right) \cdot \lvert 00\rangle`);
    });

    it('places a single-qubit gate at its wire', () => {
        const result = toUnlabeledDirac(
            circuit([quantumRegister('q', 2)], [layer(gate('RZ', [sel('q', 1)], [], { rotationAngle: Math.PI / 2 }))]),
        );

        expect(result).toBe(
            String.raw`\left(I \otimes \mathrm{R}_{z}\!\left(\frac{\pi}{2}\right)\right) \cdot \lvert 00\rangle`,
        );
    });

    it('renders an adjacent, in-order multi-qubit gate as a single block (I ⊗ CNOT)', () => {
        // CNOT(control=q1, target=q2) on 3 qubits — wires [1, 2] are contiguous and ascending.
        const cnot = gate('CX', [sel('q', 2)], [sel('q', 1)]);

        const result = toUnlabeledDirac(circuit([quantumRegister('q', 3)], [layer(cnot)]));

        expect(result).toBe(String.raw`\left(I \otimes \mathrm{CNOT}\right) \cdot \lvert 000\rangle`);
    });

    it('conjugates a non-adjacent gate with SWAPs', () => {
        // CNOT(control=q0, target=q2) on 3 qubits — wires [0, 2] are not contiguous.
        const cnot = gate('CX', [sel('q', 2)], [sel('q', 0)]);

        const result = toUnlabeledDirac(circuit([quantumRegister('q', 3)], [layer(cnot)]));

        expect(result).toBe(
            String.raw`\left(I \otimes \mathrm{SWAP}\right) \cdot \left(\mathrm{CNOT} \otimes I\right) \cdot \left(I \otimes \mathrm{SWAP}\right) \cdot \lvert 000\rangle`,
        );
    });

    it('conjugates a control-below-target gate with SWAPs (operand order preserved)', () => {
        // CNOT(control=q1, target=q0) — operand order [1, 0] is descending, so it needs a SWAP.
        const cnot = gate('CX', [sel('q', 0)], [sel('q', 1)]);

        const result = toUnlabeledDirac(circuit([quantumRegister('q', 2)], [layer(cnot)]));

        expect(result).toBe(
            String.raw`\left(\mathrm{SWAP}\right) \cdot \left(\mathrm{CNOT}\right) \cdot \left(\mathrm{SWAP}\right) \cdot \lvert 00\rangle`,
        );
    });

    it('marks an inverse gate with a dagger', () => {
        const result = toUnlabeledDirac(
            circuit([quantumRegister('q', 1)], [layer(gate('T', [sel('q', 0)], [], { inverseForm: true }))]),
        );

        expect(result).toBe(String.raw`\left(\mathrm{T}^{\dagger}\right) \cdot \lvert 0\rangle`);
    });

    it('composes operators right-to-left across layers', () => {
        const result = toUnlabeledDirac(
            circuit([quantumRegister('q', 1)], [layer(gate('H', [sel('q', 0)])), layer(gate('X', [sel('q', 0)]))]),
        );

        expect(result).toBe(String.raw`\left(\mathrm{X}\right) \cdot \left(\mathrm{H}\right) \cdot \lvert 0\rangle`);
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

        const result = toUnlabeledDirac(circuit([quantumRegister('q', 1)], [layer(measurement)]));

        expect(result).toBe(String.raw`\lvert 0\rangle`);
    });

    it('breaks per layer in the layered layout', () => {
        const result = toUnlabeledDirac(
            circuit([quantumRegister('q', 1)], [layer(gate('H', [sel('q', 0)])), layer(gate('X', [sel('q', 0)]))]),
            'layered',
        );

        expect(result).toBe(
            [
                '\\begin{aligned}',
                String.raw`& \left(\mathrm{X}\right) \\`,
                String.raw`& \cdot \left(\mathrm{H}\right) \\`,
                String.raw`& \cdot \lvert 0\rangle`,
                '\\end{aligned}',
            ].join('\n'),
        );
    });

    it('returns an empty string when there are no qubits', () => {
        expect(toUnlabeledDirac(circuit([], []))).toBe('');
    });
});
