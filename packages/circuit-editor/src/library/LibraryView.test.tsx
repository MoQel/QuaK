import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { CircuitResponse, CompositeQuantumGateDto } from '@quak/circuit-core';
import { LibraryView } from './LibraryView.tsx';
import { CircuitStoreProvider } from '../CircuitStoreContext.tsx';
import { CircuitDragProvider } from '../CircuitDragContext.tsx';

/** `gate bell a, b { h a; cx a, b; }` called on q[0], q[1]. */
const bell: CompositeQuantumGateDto = {
    id: 'call',
    type: 'COMPOSITE_QUANTUM_GATE',
    identifier: 'bell',
    inverseForm: false,
    targetQubits: [
        { registerId: 'r1', index: 0 },
        { registerId: 'r1', index: 1 },
    ],
    controlQubits: [],
    portLabels: ['a', 'b'],
    usedQubitPositions: [0, 1],
    body: [],
};

const circuitWith = (...operations: CircuitResponse['layers'][number]['quantumOperations']): CircuitResponse => ({
    id: 'c1',
    registers: [{ id: 'r1', name: 'q', type: 'Quantum_Register', numberOfQubits: 4 }],
    layers: [{ quantumOperations: operations }],
});

const renderLibrary = (circuit: CircuitResponse | undefined) =>
    render(
        <CircuitStoreProvider circuit={circuit} setCircuit={vi.fn()}>
            <CircuitDragProvider>
                <LibraryView operations={[]} onOperationSelect={vi.fn()} />
            </CircuitDragProvider>
        </CircuitStoreProvider>,
    );

describe('LibraryView', () => {
    it('offers the gates the open circuit defines', () => {
        renderLibrary(circuitWith(bell));

        expect(screen.getByText('bell')).toBeInTheDocument();
    });

    it('offers no custom gate while the circuit defines none', () => {
        renderLibrary(
            circuitWith({
                id: 'h',
                type: 'ELEMENTARY_QUANTUM_GATE',
                identifier: 'H',
                inverseForm: false,
                targetQubits: [{ registerId: 'r1', index: 0 }],
                controlQubits: [],
                rotationAngle: 0,
            }),
        );

        expect(screen.queryByText('bell')).not.toBeInTheDocument();
    });

    it('offers no custom gate while no circuit is open', () => {
        renderLibrary(undefined);

        expect(screen.queryByText('bell')).not.toBeInTheDocument();
    });

    it('renders Compositions section in list view', () => {
        renderLibrary(circuitWith(bell));

        // Switch to list view (click the toggle button)
        const toggleBtn = screen.getByRole('button');
        fireEvent.click(toggleBtn);

        expect(screen.getByText('Compositions')).toBeInTheDocument();
        expect(screen.getAllByText('bell').length).toBeGreaterThan(0);
    });
});
