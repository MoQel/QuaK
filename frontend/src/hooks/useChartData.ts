import {
    SimulationOptions,
    SimulationResult,
    StateVectorEntry,
} from '@/simulation/simulation.types.ts';
import { useMemo } from 'react';
import { ChartDataPoint } from '@/views/results-view/CustomTooltipContent.tsx';

export function useChartData(
    result: SimulationResult | null,
    options: SimulationOptions,
    numQubits: number,
) {
    return useMemo<ChartDataPoint[]>(() => {
        if (!result) return [];
        let data: ChartDataPoint[] = [];

        // Monte Carlo simulation
        if (options.mode === 'simulation' && result.counts) {
            const total = options.sampleCount || 1024;
            data = Object.entries(result.counts).map(([bitString, count]) => ({
                state: `|${bitString}>`,
                prob: ((count as number) / total) * 100,
                count: count as number,
            }));
        }
        // Exact Vector
        else if (options.mode === 'exact' && result.stateVector) {
            data = result.stateVector.map((entry: StateVectorEntry) => ({
                state: entry.state,
                prob: entry.prob * 100,
                real: entry.real,
                imag: entry.imag,
                phase: entry.phase,
            }));
        }

        // Filter insignificant states for performance (>4 qubits)
        if (numQubits >= 4) {
            data = data.filter((d) => d.prob > 0.0001);
        }

        return data.sort((a, b) => a.state.localeCompare(b.state));
    }, [result, options.mode, options.sampleCount, numQubits]);
}
