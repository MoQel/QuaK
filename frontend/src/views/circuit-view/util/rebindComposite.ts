import {
    CompositeQuantumGateDto,
    ElementSelectorDto,
    getSelectorKey,
    isCompositeGate,
    QuantumOperationDto,
} from '@/api/dto/circuit.ts';

/**
 * Re-binds a composite gate to the wires it was moved onto.
 *
 * Its body is stored bound to the call's qubits, so moving the box without touching the body leaves
 * the body's gates on wires the box no longer covers: an overlapping move silently changes what the
 * gate does (the backend still accepts it), a disjoint one makes the save fail. Parameter order is
 * what ties a port to a wire, so position *i* of the old qubit list becomes position *i* of the new
 * one — the same inversion the backend uses to rebuild the definition. Nested composites come along.
 */
export const rebindComposite = (
    composite: CompositeQuantumGateDto,
    newQubits: ElementSelectorDto[],
): CompositeQuantumGateDto => {
    const replacementByOldKey = new Map<string, ElementSelectorDto>();
    composite.targetQubits.forEach((oldQubit, position) => {
        const replacement = newQubits[position];
        if (replacement) replacementByOldKey.set(getSelectorKey(oldQubit), replacement);
    });

    const rebindSelector = (selector: ElementSelectorDto) =>
        replacementByOldKey.get(getSelectorKey(selector)) ?? selector;

    const rebindOperation = (operation: QuantumOperationDto): QuantumOperationDto => {
        const rebound = {
            ...operation,
            targetQubits: operation.targetQubits.map(rebindSelector),
            controlQubits: (operation.controlQubits ?? []).map(rebindSelector),
        };
        return isCompositeGate(rebound) ? { ...rebound, body: (rebound.body ?? []).map(rebindOperation) } : rebound;
    };

    return {
        ...composite,
        targetQubits: newQubits,
        body: (composite.body ?? []).map(rebindOperation),
    };
};
