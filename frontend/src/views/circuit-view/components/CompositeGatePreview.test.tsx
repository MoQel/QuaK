import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CompositeGatePreview } from './CompositeGatePreview.tsx';
import type { CompositeQuantumGateDto, QuantumOperationDto } from '@/api/dto/circuit.ts';

const qubit = (index: number) => ({ registerId: 'r1', index });

const bell = (overrides: Partial<CompositeQuantumGateDto> = {}): CompositeQuantumGateDto => ({
    id: 'op1',
    type: 'COMPOSITE_QUANTUM_GATE',
    identifier: 'bell',
    inverseForm: false,
    targetQubits: [qubit(0), qubit(1)],
    controlQubits: [],
    portLabels: ['a', 'b'],
    usedQubitPositions: [0, 1],
    body: [
        {
            id: 'b1',
            type: 'ELEMENTARY_QUANTUM_GATE',
            identifier: 'H',
            inverseForm: false,
            targetQubits: [qubit(0)],
            controlQubits: [],
            rotationAngle: 0,
        },
    ],
    ...overrides,
});

describe('CompositeGatePreview', () => {
    it('shows the signature and the body the box hides', () => {
        render(<CompositeGatePreview gate={bell()} />);

        expect(screen.getByText('bell (a, b)')).toBeTruthy();
        expect(screen.getByText('H')).toBeTruthy();
    });

    /** One level deep, like `expand()`: a gate called inside the body stays a box of its own. */
    it('leaves a nested gate as a box rather than expanding it', () => {
        const nested: QuantumOperationDto = {
            id: 'b1',
            type: 'COMPOSITE_QUANTUM_GATE',
            identifier: 'majority',
            inverseForm: false,
            targetQubits: [qubit(0), qubit(1)],
            controlQubits: [],
            portLabels: ['x', 'y'],
            usedQubitPositions: [0, 1],
            body: [],
        };

        render(<CompositeGatePreview gate={bell({ body: [nested] })} />);

        expect(screen.getByText('majority')).toBeTruthy();
    });

    it('says so when there is nothing to show', () => {
        render(<CompositeGatePreview gate={bell({ body: [] })} />);

        expect(screen.getByText('Empty gate body')).toBeTruthy();
    });
});
