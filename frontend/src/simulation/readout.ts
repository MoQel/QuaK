import { CircuitResponse, isClassicRegister } from '@/api/dto/circuit.ts';
import { ReadoutRegisterInfo, SimulationOutcome } from '@/simulation/simulation.types.ts';
import type { WireIndex } from '@quak/circuit-core';
import { throwSimulationError } from '@/simulation/simulation.errors.ts';

export type Bit = 0 | 1;

export interface InternalReadoutRegister extends ReadoutRegisterInfo {
    offset: number;
}

export function getClassicBitWidth(circuitData: CircuitResponse): number {
    return circuitData.registers.reduce((sum, reg) => {
        return isClassicRegister(reg) ? sum + reg.numberOfBits : sum;
    }, 0);
}

export function buildReadoutRegisters(
    circuitData: CircuitResponse,
    circuitWidth: number,
    classicWires: WireIndex,
    includeAutoReadout: boolean,
    autoReadoutOffset: number,
): InternalReadoutRegister[] {
    const classicRegisters = circuitData.registers.filter(isClassicRegister).map((register) => ({
        registerId: register.id,
        name: register.name,
        size: register.numberOfBits,
        offset: classicWires.getWireIndex({ registerId: register.id, index: 0 }) ?? 0,
    }));
    const readoutRegisters: InternalReadoutRegister[] = [...classicRegisters].reverse();

    if (includeAutoReadout) {
        readoutRegisters.unshift({
            registerId: '__auto__',
            name: 'readout',
            size: circuitWidth,
            offset: autoReadoutOffset,
        });
    }

    return readoutRegisters;
}

export function classicalBitsToBitString(classicalBits: Bit[], readoutRegisters: InternalReadoutRegister[]): string {
    return readoutRegisters.map((register) => serializeRegisterBits(classicalBits, register)).join(' ');
}

export function buildOutcomes(
    counts: Record<string, number>,
    readoutRegisters: InternalReadoutRegister[],
    sampleCount: number,
): SimulationOutcome[] {
    return Object.entries(counts)
        .map(([combinedKey, count]) => {
            const segments = combinedKey.split(' ');
            const registerValues = readoutRegisters.reduce<Record<string, string>>((values, register, index) => {
                values[register.name] = segments[index] ?? '';
                return values;
            }, {});
            const probability = count / sampleCount;

            return {
                combinedKey,
                registerValues,
                count,
                probability,
                percentage: probability * 100,
            };
        })
        .sort((a, b) => compareOutcomeKeys(a.combinedKey, b.combinedKey));
}

export function validateOutcomeIntegrity(outcomes: SimulationOutcome[], sampleCount: number): void {
    const countTotal = outcomes.reduce((sum, outcome) => sum + outcome.count, 0);
    const probabilityTotal = outcomes.reduce((sum, outcome) => sum + outcome.probability, 0);

    const invalidOutcome = outcomes.find(
        (outcome) =>
            outcome.count < 0 ||
            outcome.probability < 0 ||
            outcome.probability > 1 ||
            Number.isNaN(outcome.probability) ||
            Number.isNaN(outcome.percentage),
    );

    if (countTotal !== sampleCount || invalidOutcome || Math.abs(probabilityTotal - 1) > 1e-12) {
        throwSimulationError({
            code: 'RESULT_INTEGRITY_ERROR',
            message: 'The simulator returned an inconsistent shot distribution.',
            details: { countTotal, probabilityTotal, sampleCount, invalidOutcome },
        });
    }
}

export function compareOutcomeKeys(a: string, b: string): number {
    const aSegments = a.split(' ');
    const bSegments = b.split(' ');
    const maxSegments = Math.max(aSegments.length, bSegments.length);

    for (let index = 0; index < maxSegments; index++) {
        const aSegment = aSegments[index] ?? '';
        const bSegment = bSegments[index] ?? '';
        const lengthComparison = aSegment.length - bSegment.length;
        if (lengthComparison !== 0) return lengthComparison;

        const valueComparison = Number.parseInt(aSegment || '0', 2) - Number.parseInt(bSegment || '0', 2);
        if (valueComparison !== 0) return valueComparison;
    }

    return a.localeCompare(b);
}

function serializeRegisterBits(classicalBits: Bit[], register: InternalReadoutRegister): string {
    return Array.from({ length: register.size }, (_, index) => classicalBits[register.offset + index] ?? 0).join('');
}
