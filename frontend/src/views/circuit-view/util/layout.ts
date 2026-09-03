import type { ElementSelectorDto } from '@/api/dto/circuit.ts';
import type { FlatQubit } from '@/views/circuit-view/util/types.ts';

export const CELL_WIDTH = 64;
export const QUBIT_HEIGHT = 48;
/** Left column holding the wire labels. Fits `cout[0]` next to a fold control. */
export const LABEL_WIDTH = 64;

/**
 * How much a gate shrinks inside a repetition frame.
 *
 * The frame is drawn between the columns, so at full size the gates crowd right up against its
 * border. Taking a little off makes the box read as containing them rather than as another gate
 * sitting on the wires — and it distinguishes framed gates at a glance without changing their colour
 * or shape, which carry meaning.
 */
export const LOOP_GATE_SCALE = 0.8;

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
