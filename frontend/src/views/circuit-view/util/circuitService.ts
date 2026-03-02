import { api } from '@/api/api.ts';
import {
    AddQuantumOperationRequest,
    CircuitResponse,
    isQuantumRegister,
    MoveQuantumOperationRequest,
} from '@/api/dto/circuit.ts';

export function createCircuitService(
    circuit: CircuitResponse | undefined,
    setCircuit: (circuit: CircuitResponse) => void,
) {
    const initCircuit = (projectId: string) => {
        api.post<CircuitResponse>(`/api/circuit/${projectId}`).then(setCircuit);
    };

    const addQubit = () => {
        if (!circuit) return;
        const lastQR = circuit.registers.findLast(isQuantumRegister);
        if (lastQR) {
            api.post<CircuitResponse>(`/api/circuit/${circuit.id}/register/${lastQR.id}`).then(setCircuit);
        }
    };

    const deleteQubit = (registerId: string, qubitIdx: number) => {
        if (!circuit) return;
        api.delete<CircuitResponse>(`/api/circuit/${circuit.id}/register/${registerId}/${qubitIdx}`).then(setCircuit);
    };

    const deleteLastQubit = () => {
        if (!circuit) return;
        const lastQR = circuit.registers.findLast(isQuantumRegister);
        if (lastQR && lastQR.numberOfQubits > 0) {
            api.delete<CircuitResponse>(
                `/api/circuit/${circuit.id}/register/${lastQR.id}/${lastQR.numberOfQubits - 1}`,
            ).then(setCircuit);
        }
    };

    const resetCircuit = (projectId: string) => {
        if (!circuit) return;
        api.delete(`/api/circuit/${circuit.id}`).then(() => initCircuit(projectId));
    };

    const addQuantumOperation = (payload: AddQuantumOperationRequest) => {
        if (!circuit) return;
        api.post<CircuitResponse>(`/api/circuit/${circuit.id}/operation`, payload).then(setCircuit);
    };

    const moveQuantumOperation = (payload: MoveQuantumOperationRequest) => {
        if (!circuit) return;
        api.patch<CircuitResponse>(`/api/circuit/${circuit.id}/operation`, payload).then(setCircuit);
    };

    const removeQuantumOperation = (operationId: string) => {
        if (!circuit) return;
        api.delete<CircuitResponse>(`/api/circuit/${circuit.id}/operation/${operationId}`).then(setCircuit);
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
