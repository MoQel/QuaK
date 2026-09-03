import {
    AddQuantumOperationRequest,
    CircuitResponse,
    ElementSelectorDto,
    getInvolvedSelectors,
    isClassicRegister,
    isQuantumRegister,
    MoveQuantumOperationRequest,
    QuantumOperationDto,
    RegisterRequest,
    RegisterResponse,
    REGISTER_TYPE_CLASSIC,
    REGISTER_TYPE_QUANTUM,
} from '@/api/dto/circuit.ts';
import { detachFromLoops } from '@/views/circuit-view/util/loopMembership.ts';

/** True if the operation acts on the given qubit (target or control). */
const operationTouchesQubit = (op: QuantumOperationDto, registerId: string, qubitIdx: number): boolean =>
    getInvolvedSelectors(op).some((sel) => sel.registerId === registerId && sel.index === qubitIdx);

const operationTouchesClassicBit = (op: QuantumOperationDto, registerId: string, bitIdx: number): boolean =>
    op.type === 'MEASUREMENT' && op.classicBits.some((sel) => sel.registerId === registerId && sel.index === bitIdx);

const operationReferencesRegister = (op: QuantumOperationDto, registerId: string): boolean =>
    getInvolvedSelectors(op).some((sel) => sel.registerId === registerId) ||
    (op.type === 'MEASUREMENT' && op.classicBits.some((sel) => sel.registerId === registerId));

/** Shifts selectors above the removed index down by one to mirror backend re-indexing. */
const shiftSelectorsAfterRemoval = (
    selectors: ElementSelectorDto[],
    registerId: string,
    removedIndex: number,
): ElementSelectorDto[] =>
    selectors.map((sel) =>
        sel.registerId === registerId && sel.index > removedIndex ? { ...sel, index: sel.index - 1 } : sel,
    );

const shiftQuantumSelectorsAfterRemoval = (
    op: QuantumOperationDto,
    registerId: string,
    qubitIdx: number,
): QuantumOperationDto => {
    if (op.type === 'MEASUREMENT') {
        return {
            ...op,
            targetQubits: shiftSelectorsAfterRemoval(op.targetQubits, registerId, qubitIdx),
            controlQubits: [],
        };
    }

    if (op.type === 'DUMMY') return op;

    return {
        ...op,
        targetQubits: shiftSelectorsAfterRemoval(op.targetQubits, registerId, qubitIdx),
        controlQubits: shiftSelectorsAfterRemoval(op.controlQubits, registerId, qubitIdx),
    };
};

const shiftClassicSelectorsAfterRemoval = (
    op: QuantumOperationDto,
    registerId: string,
    bitIdx: number,
): QuantumOperationDto => {
    if (op.type !== 'MEASUREMENT') return op;

    return {
        ...op,
        classicBits: shiftSelectorsAfterRemoval(op.classicBits, registerId, bitIdx),
    };
};

const removeOperationFromLayers = (layers: CircuitResponse['layers'], operationId: string): CircuitResponse['layers'] =>
    layers
        .map((layer) => ({
            quantumOperations: layer.quantumOperations.filter((operation) => operation.id !== operationId),
        }))
        .filter((layer) => layer.quantumOperations.length > 0);

/**
 * Local mutations on the active circuit. All changes go through setCircuit and
 * are persisted by the debounced full-circuit save in CircuitTabsContext.
 */
export function createCircuitService(
    circuit: CircuitResponse | undefined,
    setCircuit: (circuit: CircuitResponse) => void,
) {
    const addQubit = (registerId?: string) => {
        if (!circuit) return;
        const targetRegId = registerId ?? circuit.registers.findLast(isQuantumRegister)?.id;
        if (!targetRegId) return;

        setCircuit({
            ...circuit,
            registers: circuit.registers.map((register) =>
                register.id === targetRegId && isQuantumRegister(register)
                    ? { ...register, numberOfQubits: register.numberOfQubits + 1 }
                    : register,
            ),
        });
    };

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
                    .map((op) => shiftQuantumSelectorsAfterRemoval(op, registerId, qubitIdx)),
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
                    type: REGISTER_TYPE_QUANTUM,
                    numberOfQubits: 4,
                },
            ],
            layers: [],
        });
    };

    const addQuantumOperation = (payload: AddQuantumOperationRequest) => {
        if (!circuit) return;
        const layers = circuit.layers.map((layer) => ({ quantumOperations: [...layer.quantumOperations] }));
        while (layers.length <= payload.layerIdx) {
            layers.push({ quantumOperations: [] });
        }
        layers[payload.layerIdx].quantumOperations.push({
            ...payload.quantumOperation,
            id: payload.quantumOperation.id ?? crypto.randomUUID(),
        });
        setCircuit({ ...circuit, layers });
    };

    const moveQuantumOperation = (payload: MoveQuantumOperationRequest) => {
        if (!circuit) return;

        const original = circuit.layers
            .flatMap((layer) => layer.quantumOperations)
            .find((operation) => operation.id === payload.quantumOperationId);
        if (!original) return;

        const movedOperation: QuantumOperationDto =
            original.type === 'MEASUREMENT'
                ? {
                      ...original,
                      targetQubits: payload.targetQubits,
                      controlQubits: [],
                      classicBits: payload.classicBits ?? original.classicBits,
                  }
                : {
                      ...original,
                      targetQubits: payload.targetQubits,
                      controlQubits: payload.controlQubits,
                  };

        const layers = circuit.layers.map((layer) => ({
            quantumOperations: layer.quantumOperations.filter((op) => op.id !== payload.quantumOperationId),
        }));
        while (layers.length <= payload.layerIdx) {
            layers.push({ quantumOperations: [] });
        }
        layers[payload.layerIdx].quantumOperations.push(movedOperation);

        setCircuit({ ...circuit, layers: layers.filter((layer) => layer.quantumOperations.length > 0) });
    };

    const removeQuantumOperation = (operationId: string) => {
        if (!circuit) return;
        setCircuit({
            ...circuit,
            layers: removeOperationFromLayers(circuit.layers, operationId),
            // A frame may not name an operation the circuit no longer has: the backend rejects the
            // whole save for it, so a deleted gate has to leave its repetition frames too.
            loopBlocks: detachFromLoops(circuit.loopBlocks ?? [], operationId),
        });
    };

    const addRegister = (payload: RegisterRequest) => {
        if (!circuit || payload.size < 1) return;

        const newRegister: RegisterResponse =
            payload.type === REGISTER_TYPE_CLASSIC
                ? {
                      id: crypto.randomUUID(),
                      name: payload.name,
                      type: REGISTER_TYPE_CLASSIC,
                      numberOfBits: payload.size,
                  }
                : {
                      id: crypto.randomUUID(),
                      name: payload.name,
                      type: REGISTER_TYPE_QUANTUM,
                      numberOfQubits: payload.size,
                  };

        setCircuit({ ...circuit, registers: [...circuit.registers, newRegister] });
    };

    const deleteRegister = (registerId: string) => {
        if (!circuit) return;
        setCircuit({
            ...circuit,
            registers: circuit.registers.filter((register) => register.id !== registerId),
            layers: circuit.layers
                .map((layer) => ({
                    quantumOperations: layer.quantumOperations.filter(
                        (op) => !operationReferencesRegister(op, registerId),
                    ),
                }))
                .filter((layer) => layer.quantumOperations.length > 0),
        });
    };

    const addClassicBit = (registerId: string) => {
        if (!circuit) return;
        setCircuit({
            ...circuit,
            registers: circuit.registers.map((register) =>
                register.id === registerId && isClassicRegister(register)
                    ? { ...register, numberOfBits: register.numberOfBits + 1 }
                    : register,
            ),
        });
    };

    const removeClassicBit = (registerId: string, bitIdx: number) => {
        if (!circuit) return;
        const register = circuit.registers.find((candidate) => candidate.id === registerId);
        if (!register || !isClassicRegister(register)) return;
        if (bitIdx < 0 || bitIdx >= register.numberOfBits) return;

        const registers: RegisterResponse[] = circuit.registers.map((candidate) =>
            candidate.id === registerId && isClassicRegister(candidate)
                ? { ...candidate, numberOfBits: candidate.numberOfBits - 1 }
                : candidate,
        );

        const layers = circuit.layers
            .map((layer) => ({
                quantumOperations: layer.quantumOperations
                    .filter((op) => !operationTouchesClassicBit(op, registerId, bitIdx))
                    .map((op) => shiftClassicSelectorsAfterRemoval(op, registerId, bitIdx)),
            }))
            .filter((layer) => layer.quantumOperations.length > 0);

        setCircuit({ ...circuit, registers, layers });
    };

    return {
        addQubit,
        deleteQubit,
        deleteLastQubit,
        resetCircuit,
        addQuantumOperation,
        moveQuantumOperation,
        removeQuantumOperation,
        addRegister,
        deleteRegister,
        addClassicBit,
        removeClassicBit,
    };
}
