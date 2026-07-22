import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ElementaryQuantumGate } from './ElementaryQuantumGate.tsx';
import type { QuantumOperationDto, RegisterResponse } from '@/api/dto/circuit.ts';

const registers: RegisterResponse[] = [{ id: 'r1', name: 'q', type: 'Quantum_Register', numberOfQubits: 1 }];

const renderGate = (operation: QuantumOperationDto) =>
    render(
        <ElementaryQuantumGate
            operation={operation}
            registers={registers}
            layerIdx={0}
            onDragStart={vi.fn()}
            onDragEnd={vi.fn()}
            onDelete={vi.fn()}
        />,
    );

describe('ElementaryQuantumGate', () => {
    it('shows the rotation angle on an rx gate', () => {
        renderGate({
            id: 'op1',
            type: 'ELEMENTARY_QUANTUM_GATE',
            identifier: 'RX',
            inverseForm: false,
            targetQubits: [{ registerId: 'r1', index: 0 }],
            controlQubits: [],
            rotationAngle: Math.PI / 2,
        });

        expect(screen.getByText('RX')).toBeTruthy();
        expect(screen.getByText('π/2')).toBeTruthy();
    });

    it('does not add an angle line to a non-parametric gate', () => {
        renderGate({
            id: 'op2',
            type: 'ELEMENTARY_QUANTUM_GATE',
            identifier: 'H',
            inverseForm: false,
            targetQubits: [{ registerId: 'r1', index: 0 }],
            controlQubits: [],
            rotationAngle: 0,
        });

        expect(screen.getByText('H')).toBeTruthy();
        expect(screen.queryByText('0')).toBeNull();
    });
});
