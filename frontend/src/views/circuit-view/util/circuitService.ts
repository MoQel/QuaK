import { api, ProblemDetailError } from '@/api/api.ts';
import {
    AddQuantumOperationRequest,
    CircuitResponse,
    isQuantumRegister,
    MoveQuantumOperationRequest,
    RegisterRequest,
} from '@/api/dto/circuit.ts';
import { toast } from 'sonner';

const handleError = (error: unknown) => {
    if (error instanceof Response && error.status === 403) {
        toast.error('Access Denied', {
            description: 'You must be the project owner to modify the circuit.',
        });
    } else if (error instanceof ProblemDetailError) {
        toast.error(error.title || 'Operation Failed', {
            description: error.detail || 'An unexpected error occured on the server.',
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
    const removeOperationLocally = (operationId: string) => {
        if (!circuit) return null;

        return {
            ...circuit,
            layers: circuit.layers
                .map((layer) => ({
                    ...layer,
                    quantumOperations: layer.quantumOperations.filter((operation) => operation.id !== operationId),
                }))
                .filter((layer) => layer.quantumOperations.length > 0),
        } satisfies CircuitResponse;
    };

    const addQubit = (registerId?: string) => {
        if (!circuit) return;
        const targetRegId = registerId ?? circuit.registers.findLast(isQuantumRegister)?.id;
        if (targetRegId) {
            api.post<CircuitResponse>(`/api/circuit/${circuit.id}/register/${targetRegId}`)
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

        const previousCircuit = circuit;
        const optimisticCircuit = removeOperationLocally(operationId);

        if (optimisticCircuit) {
            setCircuit(optimisticCircuit);
        }

        api.delete<CircuitResponse>(`/api/circuit/${circuit.id}/operation/${operationId}`)
            .then(setCircuit)
            .catch((error) => {
                setCircuit(previousCircuit);
                handleError(error);
            });
    };

    const addRegister = (payload: RegisterRequest) => {
        if (!circuit) return;
        api.post<CircuitResponse>(`/api/circuit/${circuit.id}/register`, payload).then(setCircuit).catch(handleError);
    };

    const deleteRegister = (registerId: string) => {
        if (!circuit) return;
        api.delete<CircuitResponse>(`/api/circuit/${circuit.id}/register/${registerId}`)
            .then(setCircuit)
            .catch(handleError);
    };

    const addClassicBit = (registerId: string) => {
        if (!circuit) return;
        api.post<CircuitResponse>(`/api/circuit/${circuit.id}/register/${registerId}/bit`)
            .then(setCircuit)
            .catch(handleError);
    };

    const removeClassicBit = (registerId: string, bitIdx: number) => {
        if (!circuit) return;
        api.delete<CircuitResponse>(`/api/circuit/${circuit.id}/register/${registerId}/bit/${bitIdx}`)
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
        addRegister,
        deleteRegister,
        addClassicBit,
        removeClassicBit,
    };
}
