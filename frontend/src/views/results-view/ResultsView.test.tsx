import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

import { render, screen } from '@testing-library/react';
import { ResultsView } from './ResultsView';
import { CircuitResponse, REGISTER_TYPE_CLASSIC, REGISTER_TYPE_QUANTUM } from '@/api/dto/circuit';
import { SimulationResult } from '@/simulation/simulation.types';
import { useQuantumSimulation } from '@/hooks/results/useQuantumSimulation.ts';
import { ReactNode } from 'react';

vi.mock('@/hooks/results/useQuantumSimulation.ts');

vi.mock('@/hooks/results/useChartData.ts', () => ({
    useChartData: vi.fn(() => []),
}));

import { useCircuitTabs } from '@/contexts/CircuitTabsContext.tsx';
vi.mock('@/contexts/CircuitTabsContext.tsx');

vi.mock('recharts', async (importOriginal) => {
    const actual = await importOriginal<typeof import('recharts')>();
    return {
        ...actual,
        ResponsiveContainer: ({ children }: { children: ReactNode }) => (
            <div className="recharts-responsive-container">{children}</div>
        ),
    };
});

const mockCircuit: CircuitResponse = {
    id: 'test-circuit',
    registers: [
        {
            id: 'r1',
            name: 'q',
            type: REGISTER_TYPE_QUANTUM,
            numberOfQubits: 1,
        },
    ],
    layers: [],
};

const mockMeasuredCircuit: CircuitResponse = {
    id: 'measured-circuit',
    registers: [
        {
            id: 'q1',
            name: 'q',
            type: REGISTER_TYPE_QUANTUM,
            numberOfQubits: 1,
        },
        {
            id: 'c1',
            name: 'c',
            type: REGISTER_TYPE_CLASSIC,
            numberOfBits: 1,
        },
    ],
    layers: [
        {
            quantumOperations: [
                {
                    id: 'm1',
                    type: 'MEASUREMENT',
                    identifier: 'MEASURE',
                    inverseForm: false,
                    targetQubits: [{ registerId: 'q1', index: 0 }],
                    controlQubits: [],
                    classicBits: [{ registerId: 'c1', index: 0 }],
                },
            ],
        },
    ],
};

const mockSuccessResult: SimulationResult = {
    status: 'COMPLETED',
    stateVector: [
        { state: '|0>', prob: 1.0, real: 1, imag: 0, phase: 0 },
        { state: '|1>', prob: 0.0, real: 0, imag: 0, phase: 0 },
    ],
    counts: { '0': 1024 },
    measurementResults: [],
    simulatedQubits: 1,
};

describe('ResultsView Component', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('shows empty state when no circuit is provided', () => {
        (useCircuitTabs as Mock).mockReturnValue({ activeCircuit: undefined });
        (useQuantumSimulation as Mock).mockReturnValue({
            result: null,
            isCalculating: false,
            error: null,
        });

        render(<ResultsView />);

        expect(screen.getByText(/Add qubits to the circuit/i)).toBeInTheDocument();
    });

    it('shows loading state correctly', () => {
        (useCircuitTabs as Mock).mockReturnValue({ activeCircuit: mockCircuit });
        (useQuantumSimulation as Mock).mockReturnValue({
            result: null,
            isCalculating: true,
            error: null,
        });

        render(<ResultsView />);

        const badge = screen.getByText(/Processing.../i);
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveClass('animate-pulse');
    });

    it('shows error message when simulation fails', () => {
        (useCircuitTabs as Mock).mockReturnValue({ activeCircuit: mockCircuit });
        (useQuantumSimulation as Mock).mockReturnValue({
            result: null,
            isCalculating: false,
            error: 'WASM Explosion',
        });

        render(<ResultsView />);

        expect(screen.getByText(/Simulation Error/i)).toBeInTheDocument();
        expect(screen.getByText(/WASM Explosion/i)).toBeInTheDocument();
    });

    it('renders the chart area when simulation succeeds', () => {
        (useCircuitTabs as Mock).mockReturnValue({ activeCircuit: mockCircuit });
        (useQuantumSimulation as Mock).mockReturnValue({
            result: mockSuccessResult,
            isCalculating: false,
            error: null,
        });

        render(<ResultsView />);

        expect(screen.getByText('Probabilities')).toBeInTheDocument();
        expect(screen.getByText(/Sampled computational-basis probabilities/i)).toBeInTheDocument();
    });

    it('shows classical register labels for shot-based measurement results', () => {
        (useCircuitTabs as Mock).mockReturnValue({ activeCircuit: mockMeasuredCircuit });
        (useQuantumSimulation as Mock).mockReturnValue({
            result: {
                status: 'COMPLETED',
                stateVector: [],
                counts: { '1': 1024 },
                readoutRegisters: [{ registerId: 'c1', name: 'c', size: 1 }],
                measurementResults: [
                    {
                        operationId: 'm1',
                        targetQubit: { registerId: 'q1', index: 0 },
                        classicBit: { registerId: 'c1', index: 0 },
                        outcome: 1,
                        probabilities: { zero: 0, one: 1 },
                        counts: { zero: 0, one: 1024 },
                    },
                ],
                simulatedQubits: 1,
                shots: 1024,
                measuredShotCount: 1024,
                distinctOutcomeCount: 1,
                outcomes: [
                    {
                        combinedKey: '1',
                        registerValues: { c: '1' },
                        count: 1024,
                        probability: 1,
                        percentage: 100,
                    },
                ],
                measurementMappings: [
                    {
                        operationId: 'm1',
                        executionOrder: 0,
                        source: {
                            registerId: 'q1',
                            registerName: 'q',
                            bitIndex: 0,
                            globalQubitIndex: 0,
                        },
                        target: {
                            registerId: 'c1',
                            registerName: 'c',
                            bitIndex: 0,
                            classicalAddress: 0,
                        },
                    },
                ],
            } satisfies SimulationResult,
            isCalculating: false,
            error: null,
        });

        render(<ResultsView />);

        expect(screen.getByText('c[0]')).toBeInTheDocument();
        expect(screen.getAllByText('Measurement Results').length).toBeGreaterThan(0);
        expect(screen.getByText(/1,024 shots, 1 observed outcome/i)).toBeInTheDocument();
        expect(screen.getByText(/Outcomes/i)).toBeInTheDocument();
        expect(screen.getByText(/Measurement mappings/i)).toBeInTheDocument();
        expect(screen.queryByText(/Intermediate measurements/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Conditional final state/i)).not.toBeInTheDocument();
    });
});
