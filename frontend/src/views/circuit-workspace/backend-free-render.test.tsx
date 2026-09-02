import { CircuitDragProvider, CircuitStoreProvider, CircuitView, LibraryView } from '@quak/circuit-editor';
import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CircuitResponse } from '@/api/dto/circuit.ts';
import { OperationDefinitionResponse } from '@/api/dto/library.ts';

// The point of these tests: the circuit editor and the library render from plain
// props alone: no CircuitTabsContext, no /api mock, no backend.

const circuit: CircuitResponse = {
    id: 'c1',
    registers: [{ id: 'q', name: 'q', type: 'Quantum_Register', numberOfQubits: 2 }],
    layers: [],
};

const operations: OperationDefinitionResponse[] = [
    {
        id: 'op-h',
        name: 'Hadamard',
        symbol: 'H',
        category: 'Single-qubit gates',
        description: 'Hadamard gate',
        qubitCount: 1,
        parameters: [],
        inspectorInfo: {
            operatorDefinition: 'H',
            truthTable: [],
            matrix: { display: 'H', rows: 2, cols: 2, computable: [] },
        },
    },
];

describe('circuit editor renders without a backend', () => {
    it('renders the library from an operations prop', () => {
        render(
            <CircuitDragProvider>
                <LibraryView operations={operations} onOperationSelect={vi.fn()} />
            </CircuitDragProvider>,
        );

        expect(screen.getByText('Single-qubit gates')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'H' })).toBeInTheDocument();
    });

    it('renders the circuit from the store alone', () => {
        // A plain state setter: no backend, and the editor cannot tell the difference.
        render(
            <CircuitStoreProvider circuit={circuit} setCircuit={vi.fn()}>
                <CircuitDragProvider>
                    <CircuitView />
                </CircuitDragProvider>
            </CircuitStoreProvider>,
        );

        expect(screen.getByText('q[0]')).toBeInTheDocument();
        expect(screen.getByText('q[1]')).toBeInTheDocument();
    });
});
