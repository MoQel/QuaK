import { vi, describe, it, expect } from 'vitest';

// Radix / resizable primitives used deeper in the tree expect these browser APIs.
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

import { render, screen } from '@testing-library/react';
import { CircuitResponse } from '@/api/dto/circuit.ts';
import { OperationDefinitionResponse } from '@/api/dto/library.ts';
import { CircuitView } from '@/views/circuit-workspace/circuit/CircuitView.tsx';
import { LibraryView } from '@/views/circuit-workspace/library/LibraryView.tsx';
import { CircuitDragProvider } from '@/views/circuit-workspace/CircuitDragContext.tsx';
import { CircuitPortProvider } from '@/views/circuit-workspace/CircuitPortContext.tsx';
import type { CircuitPort } from '@quak/circuit-core';

// The point of these tests: the circuit editor and the library render from plain
// props alone — no ProjectContext, no /api mock, no backend.

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
        const { container } = render(
            <CircuitDragProvider>
                <LibraryView operations={operations} onOperationSelect={vi.fn()} />
            </CircuitDragProvider>,
        );

        expect(screen.getByText('Single-qubit gates')).toBeInTheDocument();
        expect(container.querySelector('#h')).not.toBeNull();
    });

    it('renders the circuit from a circuit prop', () => {
        // A stub port: no backend, and the editor cannot tell the difference.
        const port = {
            addQubit: vi.fn(),
            deleteQubit: vi.fn(),
            deleteLastQubit: vi.fn(),
            resetCircuit: vi.fn(),
            deleteCircuit: vi.fn(),
            addQuantumOperation: vi.fn(),
            moveQuantumOperation: vi.fn(),
            removeQuantumOperation: vi.fn(),
        } satisfies CircuitPort;

        const { container } = render(
            <CircuitPortProvider port={port}>
                <CircuitDragProvider>
                    <CircuitView circuit={circuit} />
                </CircuitDragProvider>
            </CircuitPortProvider>,
        );

        expect(container).not.toBeEmptyDOMElement();
        expect(screen.getByText('q[0]')).toBeInTheDocument();
        expect(screen.getByText('q[1]')).toBeInTheDocument();
    });
});
