import { api } from '@/api/api.ts';
import { CircuitResponse } from '@/api/dto/circuit.ts';

/**
 * Persists the full content (registers and layers) of a circuit to the backend.
 * Dummy placeholder operations are stripped; they only exist during drag interactions.
 */
export const saveCircuitContent = (circuit: CircuitResponse): Promise<CircuitResponse> => {
    const payload = {
        registers: circuit.registers,
        layers: circuit.layers
            .map((layer) => ({
                quantumOperations: layer.quantumOperations.filter((op) => op.type !== 'DUMMY'),
            }))
            .filter((layer) => layer.quantumOperations.length > 0),
    };
    return api.put<CircuitResponse>(`/api/circuit/${circuit.id}`, payload);
};
