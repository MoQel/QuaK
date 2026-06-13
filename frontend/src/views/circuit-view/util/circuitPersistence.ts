import { api } from '@/api/api.ts';
import { CircuitResponse } from '@/api/dto/circuit.ts';

/**
 * Builds the registers/layers payload for the circuit content endpoints.
 * Dummy placeholder operations are stripped; they only exist during drag interactions.
 */
export const toCircuitContentPayload = (circuit: CircuitResponse) => ({
    registers: circuit.registers,
    layers: circuit.layers
        .map((layer) => ({
            quantumOperations: layer.quantumOperations.filter((op) => op.type !== 'DUMMY'),
        }))
        .filter((layer) => layer.quantumOperations.length > 0),
});

/** Persists the full content (registers and layers) of a circuit to the backend. */
export const saveCircuitContent = (circuit: CircuitResponse): Promise<CircuitResponse> =>
    api.put<CircuitResponse>(`/api/circuit/${circuit.id}`, toCircuitContentPayload(circuit));

/** Generates OpenQASM code from the circuit content without persisting anything. */
export const generateCircuitCode = (circuit: CircuitResponse): Promise<string> =>
    api.post<{ code: string }>('/api/circuit/code', toCircuitContentPayload(circuit)).then((response) => response.code);
