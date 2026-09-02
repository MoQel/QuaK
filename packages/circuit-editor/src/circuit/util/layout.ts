import type { ElementSelectorDto } from '@quak/circuit-core';
import type { FlatQubit } from './types.ts';

export const CELL_WIDTH = 64;
export const QUBIT_HEIGHT = 48;
export const LABEL_WIDTH = 48;
export const REGISTER_SECTION_GAP = 20;
export const REGISTER_HEADER_HEIGHT = 28;

export function getSelectorVisualY(flatQubits: FlatQubit[], selector: ElementSelectorDto): number {
    const exactRow = flatQubits.find(
        (qubit) => qubit.regId === selector.registerId && qubit.relQubitIdx === selector.index && !qubit.isCollapsed,
    );

    if (exactRow) return exactRow.visualY;

    return flatQubits.find((qubit) => qubit.regId === selector.registerId)?.visualY ?? 0;
}

export function isSelectorCollapsed(flatQubits: FlatQubit[], selector: ElementSelectorDto): boolean {
    return Boolean(flatQubits.find((qubit) => qubit.regId === selector.registerId)?.isCollapsed);
}
