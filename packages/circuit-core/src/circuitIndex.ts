import {
    ElementaryQuantumGateDto,
    ElementSelectorDto,
    getRegisterSize,
    getSelectorKey,
    isClassicRegister,
    isQuantumRegister,
    RegisterResponse,
} from './dto/circuit.ts';

/**
 * Selects which registers receive a wire index:
 * - `'all'`: every register, used for rendering, where classic wires are drawn too.
 * - `'quantum'`: only quantum registers, used for simulation, where indices must
 *   line up with the qubit indexing of the simulator backend.
 * - `'classic'`: only classical registers, used for the simulator's classical
 *   memory, which is addressed separately from the qubits.
 *
 * The modes are not views of one numbering: each starts at 0 and counts only the
 * registers it selects, so a qubit and a classic bit can share an index.
 */
export type CircuitIndexMode = 'all' | 'quantum' | 'classic';

/**
 * Maps a circuit element selector (register id + local index) to a single, global
 * wire index. Wires are numbered in register order and, within a register, by local
 * index, starting at 0.
 *
 * This is the shared basis for circuit mappers/translators: rather than each mapper
 * re-deriving register offsets, it asks the index for a selector's global position.
 */
export interface WireIndex {
    /** Undefined when the selector belongs to no indexed register, e.g. a classic one in `'quantum'` mode. */
    getWireIndex(selector: ElementSelectorDto): number | undefined;
}

/** Builds a {@link WireIndex}. The registers are numbered in the order they are given. */
export function buildWireIndex(registers: RegisterResponse[], mode: CircuitIndexMode = 'all'): WireIndex {
    const wireIndexBySelectorKey = new Map<string, number>();
    let nextWireIndex = 0;

    for (const register of registers) {
        if (mode === 'quantum' && !isQuantumRegister(register)) continue;
        if (mode === 'classic' && !isClassicRegister(register)) continue;

        for (let localIndex = 0; localIndex < getRegisterSize(register); localIndex++) {
            const selectorKey = getSelectorKey({ registerId: register.id, index: localIndex });
            wireIndexBySelectorKey.set(selectorKey, nextWireIndex++);
        }
    }

    return {
        getWireIndex: (selector) => wireIndexBySelectorKey.get(getSelectorKey(selector)),
    };
}

/** Returns gate operands in semantic order: controls first, then targets. */
export function getGateOperands(gate: ElementaryQuantumGateDto): ElementSelectorDto[] {
    return [...gate.controlQubits, ...gate.targetQubits];
}

/** Resolves selectors to global wire indices, skipping selectors absent from the index. */
export function resolveWireIndices(wireIndex: WireIndex, selectors: readonly ElementSelectorDto[]): number[] {
    return selectors
        .map((selector) => wireIndex.getWireIndex(selector))
        .filter((index): index is number => index !== undefined);
}
