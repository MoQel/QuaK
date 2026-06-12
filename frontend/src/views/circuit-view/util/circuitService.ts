import { CircuitResponse, getInvolvedSelectors, isQuantumRegister, RegisterResponse } from '@/api/dto/circuit.ts';

/**
 * Local mutations on the active circuit. All changes go through setCircuit and
 * are persisted to the backend by the debounced full-circuit save in
 * CircuitTabsContext, which keeps a single write path and avoids races with
 * unsaved local edits.
 */
export function createCircuitService(
    circuit: CircuitResponse | undefined,
    setCircuit: (circuit: CircuitResponse) => void,
) {
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
                    .filter(
                        (op) =>
                            !getInvolvedSelectors(op).some(
                                (sel) => sel.registerId === registerId && sel.index === qubitIdx,
                            ),
                    )
                    .map((op) => ({
                        ...op,
                        targetQubits: op.targetQubits.map((sel) =>
                            sel.registerId === registerId && sel.index > qubitIdx
                                ? { ...sel, index: sel.index - 1 }
                                : sel,
                        ),
                        controlQubits: op.controlQubits.map((sel) =>
                            sel.registerId === registerId && sel.index > qubitIdx
                                ? { ...sel, index: sel.index - 1 }
                                : sel,
                        ),
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
