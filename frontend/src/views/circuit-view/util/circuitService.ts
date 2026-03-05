import { api } from '@/api/api.ts';
import {
    AddQuantumOperationRequest,
    CircuitResponse,
    isQuantumRegister,
    MoveQuantumOperationRequest,
} from '@/api/dto/circuit.ts';

export function createCircuitService(
    circuit: CircuitResponse | undefined,
    projectId: string | undefined,
    setCircuit: (circuit: CircuitResponse) => void,
) {
    const addQubit = () => {
        if (!projectId || !circuit) return;
        const lastQR = circuit.registers.findLast(isQuantumRegister);
        if (lastQR) {
            api.post<CircuitResponse>(`/api/circuit/${projectId}/register/${lastQR.id}`).then(setCircuit);
        }
    };

    const deleteQubit = (registerId: string, qubitIdx: number) => {
        if (!projectId) return;
        api.delete<CircuitResponse>(`/api/circuit/${projectId}/register/${registerId}/${qubitIdx}`).then(setCircuit);
    };

    const deleteLastQubit = () => {
        if (!projectId || !circuit) return;
        const lastQR = circuit.registers.findLast(isQuantumRegister);
        if (lastQR && lastQR.numberOfQubits > 0) {
            api.delete<CircuitResponse>(
                `/api/circuit/${projectId}/register/${lastQR.id}/${lastQR.numberOfQubits - 1}`,
            ).then(setCircuit);
        }
    };

    const resetCircuit = () => {
        if (!projectId) return;
        api.delete<CircuitResponse>(`/api/circuit/${projectId}`).then(setCircuit);
    };

    const addQuantumOperation = (payload: AddQuantumOperationRequest) => {
        if (!projectId) return;
        api.post<CircuitResponse>(`/api/circuit/${projectId}/operation`, payload).then(setCircuit);
    };

    const moveQuantumOperation = (payload: MoveQuantumOperationRequest) => {
        if (!projectId) return;
        api.patch<CircuitResponse>(`/api/circuit/${projectId}/operation`, payload).then(setCircuit);
    };

    const removeQuantumOperation = (operationId: string) => {
        if (!projectId) return;
        api.delete<CircuitResponse>(`/api/circuit/${projectId}/operation/${operationId}`).then(setCircuit);
    };

    return {
        addQubit,
        deleteQubit,
        deleteLastQubit,
        resetCircuit,
        addQuantumOperation,
        moveQuantumOperation,
        removeQuantumOperation,
    };
}
