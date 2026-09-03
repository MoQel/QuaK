import {
    ElementSelectorDto,
    getInvolvedSelectors,
    getRegisterSize,
    QuantumOperationDto,
    RegisterResponse,
} from '@/api/dto/circuit.ts';

export interface QubitSpan {
    min: number;
    max: number;
}

/**
 * Absolute vertical wire index of a selector across all registers.
 *
 * A selector's own `index` is register-local, so `a[0]` and `b[0]` both carry index 0 while
 * sitting on different wires. Scheduling on the local index therefore both invents collisions
 * (a[0] vs b[0]) and misses real ones (an X inside a multi-qubit gate's vertical reach).
 *
 * This mirrors `QuantumCircuit.globalQubitIndex` on the backend — including how a selector whose
 * index runs past its register's end continues into the following wires — so that the stored
 * layers match the rendered columns. Keep both in sync.
 *
 * Note: `buildWireIndex` in `@/lib/circuitIndex.ts` solves a related problem for the mappers, but
 * it returns `undefined` for out-of-range selectors and can exclude classic registers; the
 * scheduler needs the backend's exact behaviour instead.
 */
export const toGlobalQubitIndex = (registers: RegisterResponse[], selector: ElementSelectorDto): number => {
    let offset = 0;
    for (const register of registers) {
        if (register.id === selector.registerId) return offset + selector.index;
        offset += getRegisterSize(register);
    }
    return offset + selector.index;
};

/** Vertical reach of an operation, from its topmost to its bottommost involved wire. */
export const getOperationSpan = (registers: RegisterResponse[], operation: QuantumOperationDto): QubitSpan => {
    const indices = getInvolvedSelectors(operation).map((selector) => toGlobalQubitIndex(registers, selector));
    return { min: Math.min(...indices), max: Math.max(...indices) };
};

/**
 * Two operations may share a column only if their vertical spans do not overlap: an actual qubit
 * conflict is covered by this, and additionally two multi-qubit gates with crossing reach are kept
 * apart, matching how the circuit is rendered.
 */
export const doSpansOverlap = (a: QubitSpan, b: QubitSpan): boolean => a.min <= b.max && b.min <= a.max;
