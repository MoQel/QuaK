import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useChartData } from './useChartData.ts';
import { SimulationOptions, SimulationResult } from '@/simulation/simulation.types.ts';

describe('useChartData Hook', () => {
    it('fills missing states with 0 probability for small circuits (< 4 qubits)', () => {
        const options = { mode: 'simulation', sampleCount: 100, maxQubits: 8 };
        const numQubits = 2;
        const mockResult = {
            status: 'COMPLETED',
            stateVector: [],
            counts: { '00': 100 },
            measurementResults: [],
            simulatedQubits: numQubits,
        };

        const { result } = renderHook(() =>
            useChartData(mockResult as SimulationResult, options as SimulationOptions, numQubits),
        );

        expect(result.current).toHaveLength(4);
        expect(result.current.find((d) => d.state === '|11>')).toBeDefined();
        expect(result.current.find((d) => d.state === '|11>')?.prob).toBe(0);
    });

    it('formats sampled simulation states with the selected endian order', () => {
        const options = { mode: 'simulation', sampleCount: 100 };
        const mockResult = {
            status: 'COMPLETED',
            stateVector: [],
            counts: { '01': 100 },
            measurementResults: [],
            simulatedQubits: 2,
        };

        const bigEndian = renderHook(() =>
            useChartData(mockResult as SimulationResult, options as SimulationOptions, 2, 'big'),
        );
        const littleEndian = renderHook(() =>
            useChartData(mockResult as SimulationResult, options as SimulationOptions, 2, 'little'),
        );

        expect(bigEndian.result.current.find((d) => d.state === '|10>')?.count).toBe(100);
        expect(littleEndian.result.current.find((d) => d.state === '|01>')?.count).toBe(100);
    });

    it('fills missing classical readout states with 0 probability for small readout registers', () => {
        const options = { mode: 'simulation', sampleCount: 100 };
        const mockResult = {
            status: 'COMPLETED',
            stateVector: [],
            counts: { '01': 25, '10': 75 },
            measurementResults: [],
            simulatedQubits: 2,
            shots: 100,
            readoutRegisters: [{ registerId: 'c', name: 'c', size: 2 }],
            outcomes: [
                {
                    combinedKey: '01',
                    registerValues: { c: '01' },
                    count: 25,
                    probability: 0.25,
                    percentage: 25,
                },
                {
                    combinedKey: '10',
                    registerValues: { c: '10' },
                    count: 75,
                    probability: 0.75,
                    percentage: 75,
                },
            ],
        };

        const { result } = renderHook(() =>
            useChartData(mockResult as SimulationResult, options as SimulationOptions, 2),
        );

        expect(result.current.map((d) => d.state)).toEqual(['00', '01', '10', '11']);
        expect(result.current.find((d) => d.state === '00')?.prob).toBe(0);
        expect(result.current.find((d) => d.state === '11')?.registerValues).toEqual({ c: '11' });
    });
});
