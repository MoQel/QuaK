import { api } from '@/api/api.ts';
import {
    AddQuantumOperationRequest,
    CircuitResponse,
    isQuantumRegister,
    MoveQuantumOperationRequest,
} from '@/api/dto/circuit.ts';
import { toast } from 'sonner';

const handleError = (error: unknown) => {
    if (error instanceof Response && error.status === 403) {
        toast.error('Access Denied', {
            description: 'You must be the project owner to modify the circuit.',
        });
    } else {
        toast.error('Operation Failed', {
            description: 'An error occurred while performing the circuit operation.',
        });
    }
};

export function createCircuitService(
    circuit: CircuitResponse | undefined,
    setCircuit: (circuit: CircuitResponse) => void,
) {
    const addQubit = () => {
        if (!circuit) return;
        const lastQR = circuit.registers.findLast(isQuantumRegister);
        if (lastQR) {
            api.post<CircuitResponse>(`/api/circuit/${circuit.id}/register/${lastQR.id}`)
                .then(setCircuit)
                .catch(handleError);
        }
    };

    const deleteQubit = (registerId: string, qubitIdx: number) => {
        if (!circuit) return;
        api.delete<CircuitResponse>(`/api/circuit/${circuit.id}/register/${registerId}/${qubitIdx}`)
            .then(setCircuit)
            .catch(handleError);
    };

    const deleteLastQubit = () => {
        if (!circuit) return;
        const lastQR = circuit.registers.findLast(isQuantumRegister);
        if (lastQR && lastQR.numberOfQubits > 0) {
            api.delete<CircuitResponse>(`/api/circuit/${circuit.id}/register/${lastQR.id}/${lastQR.numberOfQubits - 1}`)
                .then(setCircuit)
                .catch(handleError);
        }
    };

    const resetCircuit = () => {
        if (!circuit) return;
        api.delete<CircuitResponse>(`/api/circuit/${circuit.id}/reset`).then(setCircuit).catch(handleError);
    };

    const deleteCircuit = () => {
        if (!circuit) return;
        api.delete(`/api/circuit/${circuit.id}`).catch(handleError);
    };

    const addQuantumOperation = (payload: AddQuantumOperationRequest) => {
        if (!circuit) return;
        api.post<CircuitResponse>(`/api/circuit/${circuit.id}/operation`, payload).then(setCircuit).catch(handleError);
    };

    const moveQuantumOperation = (payload: MoveQuantumOperationRequest) => {
        if (!circuit) return;
        api.patch<CircuitResponse>(`/api/circuit/${circuit.id}/operation`, payload).then(setCircuit).catch(handleError);
    };

    const removeQuantumOperation = (operationId: string) => {
        if (!circuit) return;
        api.delete<CircuitResponse>(`/api/circuit/${circuit.id}/operation/${operationId}`)
            .then(setCircuit)
            .catch(handleError);
    };

    return {
        addQubit,
        deleteQubit,
        deleteLastQubit,
        resetCircuit,
        deleteCircuit,
        addQuantumOperation,
        moveQuantumOperation,
        removeQuantumOperation,
    };
}
