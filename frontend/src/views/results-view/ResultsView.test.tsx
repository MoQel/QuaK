import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { ResultsView } from './ResultsView';
import { CircuitResponse } from '@/api/dto/circuit';
import { SimulationResult } from '@/simulation/simulation.types';
import {useQuantumSimulation} from "@/hooks/useQuantumSimulation.ts";

vi.mock('@/simulation/useQuantumSimulation');

// Dummy Test
const mockCircuit: CircuitResponse = {
    id: 'test',
    registers: [{
        id: 'r1',
        name: 'q',
        qubits: [{ id: 'q0', gates: [] }] // 1 Qubit
    }]
};

const mockSuccessResult: SimulationResult = {
    stateVector: [
        { state: '|0>', prob: 1.0, real: 1, imag: 0, phase: 0 },
        { state: '|1>', prob: 0.0, real: 0, imag: 0, phase: 0 }
    ],
    counts: { '0': 1024 }
};

describe('ResultsView Component', () => {

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('shows empty state when no circuit is provided', () => {
        (useQuantumSimulation as Mock).mockReturnValue({
            result: null,
            isLoading: false,
            error: null
        });

        render(<ResultsView circuit={null} />);

        expect(screen.getByText(/Add qubits to the circuit/i)).toBeInTheDocument();
    });

    it('shows loading state correctly', () => {
        (useQuantumSimulation as Mock).mockReturnValue({
            result: null,
            isLoading: true,
            error: null
        });

        render(<ResultsView circuit={mockCircuit} />);

        expect(screen.getByText(/Calculating/i)).toBeInTheDocument();
    });

    it('shows error message when simulation fails', () => {
        (useQuantumSimulation as Mock).mockReturnValue({
            result: null,
            isLoading: false,
            error: "WASM Explosion"
        });

        render(<ResultsView circuit={mockCircuit} />);

        expect(screen.getByText(/Simulation Error: WASM Explosion/i)).toBeInTheDocument();
    });

    it('renders the chart and badges when simulation succeeds', () => {
        (useQuantumSimulation as Mock).mockReturnValue({
            result: mockSuccessResult,
            isLoading: false,
            error: null
        });

        render(<ResultsView circuit={mockCircuit} />);

        expect(screen.getByText('Simulation Results')).toBeInTheDocument();

        expect(screen.getByText('1 Qubits')).toBeInTheDocument();

        expect(screen.getByText(/Monte Carlo/i)).toBeInTheDocument();
    });
});