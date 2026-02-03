import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useChartData } from './useChartData';
import { SimulationOptions, SimulationResult } from '@/simulation/simulation.types.ts';

describe('useChartData Hook', () => {
    it('fills missing states with 0 probability for small circuits (< 4 qubits)', () => {
        const mockResult = { stateVector: [], counts: { '00': 100 } };
        const options = { mode: 'simulation', sampleCount: 100, maxQubits: 8 };
        const numQubits = 2; // Should create |00>, |01>, |10>, |11>

        const { result } = renderHook(() =>
            useChartData(mockResult as SimulationResult, options as SimulationOptions, numQubits),
        );

        expect(result.current).toHaveLength(4);
        expect(result.current.find((d) => d.state === '|11>')).toBeDefined();
        expect(result.current.find((d) => d.state === '|11>')?.prob).toBe(0);
    });
});
