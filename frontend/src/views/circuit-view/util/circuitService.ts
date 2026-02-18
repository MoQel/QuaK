import { api } from '@/api/api.ts';
import { AddQuantumOperationRequest, CircuitResponse, MoveQuantumOperationRequest } from '@/api/dto/circuit.ts';

export function createCircuitService(
    circuit: CircuitResponse | undefined,
    setCircuit: (circuit: CircuitResponse) => void,
) {
    const initCircuit = () => {
        api.post<CircuitResponse>('/api/circuit').then(setCircuit);
    };

    const addQubit = () => {
        if (!circuit) return;
        const lastReg = circuit.registers.at(-1);
        if (lastReg) {
            api.post<CircuitResponse>(`/api/circuit/${circuit.id}/register/${lastReg.id}`).then(setCircuit);
        }
    };

    const deleteLastQubit = () => {
        if (!circuit) return;
        const lastReg = circuit.registers.at(-1);
        if (lastReg) {
            api.delete<CircuitResponse>(`/api/circuit/${circuit.id}/register/${lastReg.id}`).then(setCircuit);
        }
    };

    const resetCircuit = () => {
        if (!circuit) return;
        api.delete(`/api/circuit/${circuit.id}`).then(initCircuit);
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
        initCircuit,
        addQubit,
        deleteLastQubit,
        resetCircuit,
        addQuantumOperation,
        moveQuantumOperation,
        removeQuantumOperation,
    };
}
