import { api } from '@/api/api.ts';
import { CircuitResponse, isSubcircuit, SubcircuitOperationDto } from '@/api/dto/circuit.ts';

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
    api
        .post<{ code: string }>('/api/circuit/qasmCode', toCircuitContentPayload(circuit))
        .then((response) => response.code);

/**
 * Copies the fields the backend resolves onto a circuit held in memory, matched by operation id.
 *
 * A subcircuit is created client-side from a drop knowing only which circuit it points at; what
 * that circuit *does* is filled in on read. Discarding the save's response left the circuit in the
 * browser without it, so a freshly placed subcircuit could not be simulated until the tab was
 * reloaded. Only the resolved fields are taken: the response also carries the backend's own
 * scheduling, and adopting that wholesale would move gates under an edit still in progress.
 */
export const withResolvedSubcircuits = (circuit: CircuitResponse, saved: CircuitResponse): CircuitResponse => {
    const resolved = new Map<string, SubcircuitOperationDto>();
    for (const layer of saved.layers) {
        for (const operation of layer.quantumOperations) {
            if (isSubcircuit(operation) && operation.id) resolved.set(operation.id, operation);
        }
    }
    if (resolved.size === 0) return circuit;

    return {
        ...circuit,
        layers: circuit.layers.map((layer) => ({
            ...layer,
            quantumOperations: layer.quantumOperations.map((operation) => {
                const match = operation.id ? resolved.get(operation.id) : undefined;
                if (!match || !isSubcircuit(operation)) return operation;
                return { ...operation, body: match.body, definitionName: match.definitionName };
            }),
        })),
    };
};
