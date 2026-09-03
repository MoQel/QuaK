import { describe, expect, it, Mock, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/store/store.ts';
import { LibraryView } from './LibraryView.tsx';
import { CircuitResponse, CompositeQuantumGateDto } from '@/api/dto/circuit.ts';

import { useCircuitTabs } from '@/contexts/CircuitTabsContext.tsx';
vi.mock('@/contexts/CircuitTabsContext.tsx');

// The catalogue is served by the backend and is not what these tests are about; an empty one keeps
// the built-in tiles out of the way of the custom section.
vi.mock('@/api/api.ts', () => ({
    api: { get: vi.fn(() => Promise.resolve([])) },
}));

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

const renderLibrary = async (activeCircuit: CircuitResponse | undefined) => {
    (useCircuitTabs as Mock).mockReturnValue({
        activeCircuit,
        activeCircuitTabId: activeCircuit ? 'tab' : null,
        setActiveCircuit: vi.fn(),
    });

    const result = render(
        <Provider store={store}>
            <LibraryView onOperationSelect={vi.fn()} />
        </Provider>,
    );

    // Let the catalogue fetch settle, so its state update lands inside the test rather than after it.
    await act(async () => {});
    return result;
};

describe('LibraryView', () => {
    /** A gate the circuit defines sits among the built-ins, with no heading of its own. */
    it('offers the gates the open circuit defines', async () => {
        await renderLibrary(circuitWith(bell));

        expect(screen.getByText('bell')).toBeInTheDocument();
    });

    it('offers no custom gate while the circuit defines none', async () => {
        await renderLibrary(
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

    it('offers no custom gate while no circuit is open', async () => {
        await renderLibrary(undefined);

        expect(screen.queryByText('bell')).not.toBeInTheDocument();
    });
});
