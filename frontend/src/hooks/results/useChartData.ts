import { SimulationOptions, SimulationResult, StateVectorEntry } from '@/simulation/simulation.types.ts';
import { useMemo } from 'react';
import { ChartDataPoint } from '@/views/results-view/CustomTooltipContent.tsx';

export type Endianness = 'big' | 'little';

export function useChartData(
    result: SimulationResult | null,
    options: SimulationOptions,
    numQubits: number,
    endianness: Endianness = 'big',
) {
    return useMemo<ChartDataPoint[]>(() => {
        if (!result) return [];
        let data: ChartDataPoint[] = [];

        const formatBits = (bits: string) => {
            return endianness === 'big' ? bits.split('').reverse().join('') : bits;
        };

        if (options.mode === 'simulation' && result.counts) {
            const total = options.sampleCount || 1024;

            // If we have fewer than 11 qubits, we generate ALL possible states (including 0%),
            // so that we can show all states.
            if (numQubits <= 10) {
                const totalStates = 1 << numQubits; // 2^n
                for (let i = 0; i < totalStates; i++) {
                    const bitString = i.toString(2).padStart(numQubits, '0');
                    const count = result.counts[bitString] || 0;

                    data.push({
                        state: `|${formatBits(bitString)}>`,
                        prob: (count / total) * 100,
                        count: count,
                    });
                }
            } else {
                // Safety: if we have too much states just show the non-zero states
                data = Object.entries(result.counts).map(([bitString, count]) => ({
                    state: `|${formatBits(bitString)}>`,
                    prob: (count / total) * 100,
                    count: count,
                }));
            }
        } else if (options.mode === 'exact' && result.stateVector) {
            data = result.stateVector.map((entry: StateVectorEntry) => {
                const rawBits = entry.state.slice(1, -1);
                return {
                    state: `|${formatBits(rawBits)}>`,
                    prob: entry.prob * 100,
                    real: entry.real,
                    imag: entry.imag,
                    phase: entry.phase,
                };
            });
        }

        return data.sort((a, b) => a.state.localeCompare(b.state));
    }, [result, options.mode, options.sampleCount, numQubits, endianness]);
}
