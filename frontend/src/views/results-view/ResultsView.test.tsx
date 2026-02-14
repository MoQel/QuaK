import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

import { render, screen } from '@testing-library/react';
import { ResultsView } from './ResultsView';
import { CircuitResponse } from '@/api/dto/circuit';
import { SimulationResult } from '@/simulation/simulation.types';
import { useQuantumSimulation } from '@/hooks/results/useQuantumSimulation.ts';
import { ReactNode } from 'react';

vi.mock('@/hooks/results/useQuantumSimulation.ts');

vi.mock('@/hooks/results/useChartData.ts', () => ({
    useChartData: vi.fn(() => []),
}));

vi.mock('recharts', async (importOriginal) => {
    const actual = await importOriginal<typeof import('recharts')>();
    return {
        ...actual,
        ResponsiveContainer: ({ children }: { children: ReactNode }) => (
            <div className="recharts-responsive-container">{children}</div>
        ),
    };
});

// Mock-Data
const mockCircuit: CircuitResponse = {
    id: 'test-circuit',
    registers: [
        {
            id: 'r1',
            name: 'q',
            numberOfQubits: 1,
        },
    ],
    layers: [],
};

const mockSuccessResult: SimulationResult = {
    stateVector: [
        { state: '|0>', prob: 1.0, real: 1, imag: 0, phase: 0 },
        { state: '|1>', prob: 0.0, real: 0, imag: 0, phase: 0 },
    ],
    counts: { '0': 1024 },
    simulatedQubits: 1,
};

describe('ResultsView Component', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('shows empty state when no circuit is provided', () => {
        (useQuantumSimulation as Mock).mockReturnValue({
            result: null,
            isCalculating: false,
            error: null,
        });

        render(<ResultsView circuit={undefined} />);

        expect(screen.getByText(/Add qubits to the circuit/i)).toBeInTheDocument();
    });

    it('shows loading state correctly', () => {
        (useQuantumSimulation as Mock).mockReturnValue({
            result: null,
            isCalculating: true,
            error: null,
        });

        render(<ResultsView circuit={mockCircuit} />);

        const badge = screen.getByText(/Calculating/i);
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveClass('animate-pulse');
    });

    it('shows error message when simulation fails', () => {
        (useQuantumSimulation as Mock).mockReturnValue({
            result: null,
            isCalculating: false,
            error: 'WASM Explosion',
        });

        render(<ResultsView circuit={mockCircuit} />);

        expect(screen.getByText(/Simulation Error/i)).toBeInTheDocument();
        expect(screen.getByText(/WASM Explosion/i)).toBeInTheDocument();
    });

    it('renders the chart area when simulation succeeds', () => {
        (useQuantumSimulation as Mock).mockReturnValue({
            result: mockSuccessResult,
            isCalculating: false,
            error: null,
        });

        render(<ResultsView circuit={mockCircuit} />);

        expect(screen.getByText(/Simulation Results/i)).toBeInTheDocument();
        expect(screen.getByText('|q0>')).toBeInTheDocument();
        expect(screen.getByText(/Basis:/i)).toBeInTheDocument();
    });
});
