import {
    ElementSelectorDto,
    getRegisterSize,
    getSelectorKey,
    isQuantumRegister,
    RegisterResponse,
} from '@/api/dto/circuit.ts';

/**
 * Selects which registers receive a wire index:
 * - `'all'`: every register — used for rendering, where classic wires are drawn too.
 * - `'quantum'`: only quantum registers — used for simulation, where indices must
 *   line up with the qubit indexing of the simulator backend.
 */
export type CircuitIndexMode = 'all' | 'quantum';

/**
 * Maps a circuit element selector (register id + local index) to a single, global
 * wire index. Wires are numbered in register order and, within a register, by local
 * index, starting at 0.
 *
 * This is the shared basis for circuit mappers/translators: rather than each mapper
 * re-deriving register offsets, it asks the index for a selector's global position.
 */
export interface WireIndex {
    /**
     * Returns the global wire index for the given selector, or `undefined` if the
     * selector does not belong to any indexed register (e.g. a classic-register
     * selector while in `'quantum'` mode). Callers must handle `undefined`.
     */
    getWireIndex(selector: ElementSelectorDto): number | undefined;
}

/**
 * Builds a {@link WireIndex} for the given registers.
 *
 * @param registers circuit registers, in the order they should be laid out.
 * @param mode which registers to include (see {@link CircuitIndexMode}), defaults to `'all'`.
 */
export function buildWireIndex(registers: RegisterResponse[], mode: CircuitIndexMode = 'all'): WireIndex {
    const wireIndexBySelectorKey = new Map<string, number>();
    let nextWireIndex = 0;

    for (const register of registers) {
        // In quantum mode, classic registers are not assigned a wire index.
        if (mode === 'quantum' && !isQuantumRegister(register)) continue;

        for (let localIndex = 0; localIndex < getRegisterSize(register); localIndex++) {
            const selectorKey = getSelectorKey({ registerId: register.id, index: localIndex });
            wireIndexBySelectorKey.set(selectorKey, nextWireIndex++);
        }
    }

    return {
        getWireIndex: (selector) => wireIndexBySelectorKey.get(getSelectorKey(selector)),
    };
}
