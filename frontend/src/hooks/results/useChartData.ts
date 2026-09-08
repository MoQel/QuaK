import type { SimulationOptions, SimulationResult, StateVectorEntry } from '@/simulation/simulation.types.ts';
import { useMemo } from 'react';
import type { ChartDataPoint } from '@/views/results-view/CustomTooltipContent.tsx';

export type Endianness = 'big' | 'little';

export function useChartData(
    result: SimulationResult | null,
    options: SimulationOptions,
    numQubits: number,
    endianness: Endianness = 'big',
) {
    return useMemo<ChartDataPoint[]>(() => {
        return buildChartData(result, options, numQubits, endianness);
    }, [result, options.mode, options.sampleCount, numQubits, endianness]);
}

function buildChartData(
    result: SimulationResult | null,
    options: SimulationOptions,
    numQubits: number,
    endianness: Endianness,
): ChartDataPoint[] {
    if (!result) return [];

    if (options.mode === 'simulation' && result.counts) {
        return buildSimulationData(result, options, numQubits, endianness).sort(compareChartStates);
    }

    if (options.mode === 'exact' && result.stateVector) {
        return buildExactStateData(result.stateVector, endianness).sort(compareChartStates);
    }

    return [];
}

function buildSimulationData(
    result: SimulationResult,
    options: SimulationOptions,
    numQubits: number,
    endianness: Endianness,
): ChartDataPoint[] {
    const total = result.shots ?? options.sampleCount ?? 1024;
    const hasClassicalReadout = (result.readoutRegisters?.length ?? 0) > 0;

    if (hasClassicalReadout) {
        return buildClassicalReadoutData(result, total);
    }

    return numQubits <= 10
        ? buildFullSimulationData(result, total, numQubits, endianness)
        : buildObservedSimulationData(result, total, endianness);
}

function buildClassicalReadoutData(result: SimulationResult, total: number): ChartDataPoint[] {
    if (result.outcomes?.length) {
        const outcomesByKey = new Map(result.outcomes.map((outcome) => [outcome.combinedKey, outcome]));
        const combinedKeys = shouldExpandReadoutStates(result)
            ? buildReadoutKeys(result)
            : Array.from(outcomesByKey.keys());

        return combinedKeys.map((combinedKey) => {
            const outcome = outcomesByKey.get(combinedKey);

            return {
                state: combinedKey,
                prob: outcome?.percentage ?? 0,
                count: outcome?.count ?? 0,
                probability: outcome?.probability ?? 0,
                registerValues: outcome?.registerValues ?? splitReadoutKey(combinedKey, result),
            };
        });
    }

    return buildObservedSimulationData(result, total);
}

function buildFullSimulationData(
    result: SimulationResult,
    total: number,
    numQubits: number,
    endianness: Endianness,
): ChartDataPoint[] {
    return Array.from({ length: 1 << numQubits }, (_, value) => {
        const bitString = value.toString(2).padStart(numQubits, '0');
        const count = result.counts?.[bitString] ?? 0;

        return {
            state: `|${formatBits(bitString, endianness)}>`,
            prob: (count / total) * 100,
            count,
        };
    });
}

function buildObservedSimulationData(
    result: SimulationResult,
    total: number,
    endianness?: Endianness,
): ChartDataPoint[] {
    return Object.entries(result.counts ?? {}).map(([bitString, count]) => ({
        state: endianness ? `|${formatBits(bitString, endianness)}>` : bitString,
        prob: (count / total) * 100,
        count,
    }));
}

function buildExactStateData(stateVector: StateVectorEntry[], endianness: Endianness): ChartDataPoint[] {
    return stateVector.map((entry) => {
        const rawBits = entry.state.slice(1, -1);

        return {
            state: `|${formatBits(rawBits, endianness)}>`,
            prob: entry.prob * 100,
            real: entry.real,
            imag: entry.imag,
            phase: entry.phase,
        };
    });
}

function formatBits(bits: string, endianness: Endianness): string {
    return endianness === 'big' ? bits.split('').reverse().join('') : bits;
}

function shouldExpandReadoutStates(result: SimulationResult): boolean {
    const bitWidth = result.readoutRegisters?.reduce((sum, register) => sum + register.size, 0) ?? 0;
    return bitWidth > 0 && bitWidth <= 10;
}

function buildReadoutKeys(result: SimulationResult): string[] {
    const registers = result.readoutRegisters ?? [];

    return registers.reduce<string[]>(
        (keys, register) => {
            const registerKeys = Array.from({ length: 1 << register.size }, (_, value) =>
                value.toString(2).padStart(register.size, '0'),
            );

            return keys.flatMap((prefix) =>
                registerKeys.map((registerKey) => (prefix ? `${prefix} ${registerKey}` : registerKey)),
            );
        },
        [''],
    );
}

function splitReadoutKey(combinedKey: string, result: SimulationResult): Record<string, string> {
    const segments = combinedKey.split(' ');

    return (result.readoutRegisters ?? []).reduce<Record<string, string>>((registerValues, register, index) => {
        registerValues[register.name] = segments[index] ?? ''.padStart(register.size, '0');
        return registerValues;
    }, {});
}

function compareChartStates(a: ChartDataPoint, b: ChartDataPoint): number {
    return compareOutcomeKeys(a.state, b.state);
}

function compareOutcomeKeys(a: string, b: string): number {
    const normalizedA = a.startsWith('|') ? a.slice(1, -1) : a;
    const normalizedB = b.startsWith('|') ? b.slice(1, -1) : b;
    const aSegments = normalizedA.split(' ');
    const bSegments = normalizedB.split(' ');
    const maxSegments = Math.max(aSegments.length, bSegments.length);

    for (let index = 0; index < maxSegments; index++) {
        const aSegment = aSegments[index] ?? '';
        const bSegment = bSegments[index] ?? '';
        const lengthComparison = aSegment.length - bSegment.length;
        if (lengthComparison !== 0) return lengthComparison;

        const valueComparison = Number.parseInt(aSegment || '0', 2) - Number.parseInt(bSegment || '0', 2);
        if (valueComparison !== 0) return valueComparison;
    }

    return normalizedA.localeCompare(normalizedB);
}
