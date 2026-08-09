import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ElementaryQuantumGate } from './ElementaryQuantumGate.tsx';
import type { QuantumOperationDto, RegisterResponse } from '@/api/dto/circuit.ts';

const registers: RegisterResponse[] = [{ id: 'r1', name: 'q', type: 'Quantum_Register', numberOfQubits: 1 }];

const renderGate = (
    operation: QuantumOperationDto,
    extras: { repeatCount?: number; onRemoveLoop?: () => void; onEditAngle?: () => void } = {},
) =>
    render(
        <ElementaryQuantumGate
            operation={operation}
            registers={registers}
            layerIdx={0}
            onDragStart={vi.fn()}
            onDragEnd={vi.fn()}
            onDelete={vi.fn()}
            loopRepeatCount={extras.repeatCount}
            onRemoveLoop={extras.onRemoveLoop}
            onEditAngle={extras.onEditAngle}
        />,
    );

const hGate = (): QuantumOperationDto => ({
    id: 'op-h',
    type: 'ELEMENTARY_QUANTUM_GATE',
    identifier: 'H',
    inverseForm: false,
    targetQubits: [{ registerId: 'r1', index: 0 }],
    controlQubits: [],
    rotationAngle: 0,
});

const rxGate = (): QuantumOperationDto => ({
    id: 'op-rx',
    type: 'ELEMENTARY_QUANTUM_GATE',
    identifier: 'RX',
    inverseForm: false,
    targetQubits: [{ registerId: 'r1', index: 0 }],
    controlQubits: [],
    rotationAngle: Math.PI / 2,
});

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

    /**
     * A gate inside a repetition frame is the only place the user can reach the frame from — the
     * frame itself is a `pointer-events-none` outline, so it cannot be clicked.
     */
    it('offers removing the enclosing loop on right-click', async () => {
        const onRemoveLoop = vi.fn();
        const { container } = renderGate(hGate(), { repeatCount: 3, onRemoveLoop });

        fireEvent.contextMenu(container.firstElementChild as HTMLElement);

        fireEvent.click(await screen.findByText('Remove loop ×3'));
        expect(onRemoveLoop).toHaveBeenCalledTimes(1);
    });

    /** Outside a frame there is nothing to offer, so the gate stays a plain draggable element. */
    it('has no context menu when it is not in a loop', () => {
        const { container } = renderGate(hGate());

        fireEvent.contextMenu(container.firstElementChild as HTMLElement);

        expect(screen.queryByText(/Remove loop/)).toBeNull();
    });
    /** The angle is shown on the box, so the box is where it has to be editable from. */
    it('offers changing the angle of a rotation gate on right-click', async () => {
        const onEditAngle = vi.fn();
        const { container } = renderGate(rxGate(), { onEditAngle });

        fireEvent.contextMenu(container.firstElementChild as HTMLElement);

        fireEvent.click(await screen.findByText('Change angle…'));
        expect(onEditAngle).toHaveBeenCalledTimes(1);
    });

    /** An H has no angle, so the entry would be an action that does nothing. */
    it('does not offer an angle on a gate that has none', () => {
        const { container } = renderGate(hGate(), { onEditAngle: vi.fn() });

        fireEvent.contextMenu(container.firstElementChild as HTMLElement);

        expect(screen.queryByText('Change angle…')).toBeNull();
    });
});
