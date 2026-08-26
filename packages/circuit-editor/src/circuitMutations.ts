import {
    CircuitResponse,
    ElementSelectorDto,
    getInvolvedSelectors,
    isQuantumRegister,
    QuantumOperationDto,
    RegisterResponse,
} from '@quak/circuit-core';
import type { CircuitStore } from './CircuitStoreContext.tsx';

/** True if the operation acts on the given qubit (target or control). */
const operationTouchesQubit = (op: QuantumOperationDto, registerId: string, qubitIdx: number): boolean =>
    getInvolvedSelectors(op).some((sel) => sel.registerId === registerId && sel.index === qubitIdx);

/** Shifts selectors above the removed qubit down by one to mirror the backend's re-indexing. */
const shiftSelectorsAfterRemoval = (
    selectors: ElementSelectorDto[],
    registerId: string,
    qubitIdx: number,
): ElementSelectorDto[] =>
    selectors.map((sel) =>
        sel.registerId === registerId && sel.index > qubitIdx ? { ...sel, index: sel.index - 1 } : sel,
    );

/**
 * Register-level edits on the circuit. Pure: every change is a new
 * `CircuitResponse` handed to `setCircuit`; what persistence means is the host's
 * business (the web IDE debounces a full save, the extension rewrites the .qasm).
 */
export function createCircuitMutations(circuit: CircuitResponse | undefined, setCircuit: CircuitStore['setCircuit']) {
    const addQubit = () => {
        if (!circuit) return;
        const lastQR = circuit.registers.findLast(isQuantumRegister);
        if (!lastQR) return;

        setCircuit({
            ...circuit,
            registers: circuit.registers.map((register) =>
                register.id === lastQR.id && isQuantumRegister(register)
                    ? { ...register, numberOfQubits: register.numberOfQubits + 1 }
                    : register,
            ),
        });
    };

    /**
     * Removes a qubit and mirrors the backend semantics: operations touching the
     * removed qubit are dropped, selectors above it shift down by one.
     */
    const deleteQubit = (registerId: string, qubitIdx: number) => {
        if (!circuit) return;
        const register = circuit.registers.find((candidate) => candidate.id === registerId);
        if (!register || !isQuantumRegister(register)) return;
        if (qubitIdx < 0 || qubitIdx >= register.numberOfQubits) return;

        const registers: RegisterResponse[] = circuit.registers.map((candidate) =>
            candidate.id === registerId && isQuantumRegister(candidate)
                ? { ...candidate, numberOfQubits: candidate.numberOfQubits - 1 }
                : candidate,
        );

        const layers = circuit.layers
            .map((layer) => ({
                quantumOperations: layer.quantumOperations
                    .filter((op) => !operationTouchesQubit(op, registerId, qubitIdx))
                    .map((op) => ({
                        ...op,
                        targetQubits: shiftSelectorsAfterRemoval(op.targetQubits, registerId, qubitIdx),
                        controlQubits: shiftSelectorsAfterRemoval(op.controlQubits, registerId, qubitIdx),
                    })),
            }))
            .filter((layer) => layer.quantumOperations.length > 0);

        setCircuit({ ...circuit, registers, layers });
    };

    const deleteLastQubit = () => {
        if (!circuit) return;
        const lastQR = circuit.registers.findLast(isQuantumRegister);
        if (lastQR && lastQR.numberOfQubits > 0) {
            deleteQubit(lastQR.id, lastQR.numberOfQubits - 1);
        }
    };

    const resetCircuit = () => {
        if (!circuit) return;
        setCircuit({
            ...circuit,
            registers: [
                {
                    id: crypto.randomUUID(),
                    name: 'q',
                    type: 'Quantum_Register',
                    numberOfQubits: 4,
                },
            ],
            layers: [],
        });
    };

    return {
        addQubit,
        deleteQubit,
        deleteLastQubit,
        resetCircuit,
    };
}
