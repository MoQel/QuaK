import { api } from '@/api/api.ts';
import { CircuitResponse, isSubcircuit, LoopBlockDto, SubcircuitOperationDto } from '@/api/dto/circuit.ts';

/**
 * Builds the registers/layers/loopBlocks payload for the circuit content endpoints.
 * Dummy placeholder operations are stripped; they only exist during drag interactions.
 *
 * The frames have to travel with every save: the endpoint is full-replace, so omitting them means
 * "this circuit has none" and the first autosave after parsing a loop would wipe it.
 */
export const toCircuitContentPayload = (circuit: CircuitResponse) => {
    const layers = circuit.layers
        .map((layer) => ({
            quantumOperations: layer.quantumOperations.filter((op) => op.type !== 'DUMMY'),
        }))
        .filter((layer) => layer.quantumOperations.length > 0);

    return {
        registers: circuit.registers,
        layers,
        loopBlocks: keepFramesOverExistingOperations(circuit.loopBlocks ?? [], layers),
    };
};

/**
 * Drops members whose operation is gone, and frames left without any.
 *
 * The backend rejects a frame naming an operation the payload does not contain (422), and a deleted
 * gate is exactly how that happens: removing an operation from a layer says nothing about the frames
 * that covered it. Cleaning up here keeps a delete from making the circuit unsavable.
 */
const keepFramesOverExistingOperations = (
    loopBlocks: LoopBlockDto[],
    layers: CircuitResponse['layers'],
): LoopBlockDto[] => {
    const present = new Set(layers.flatMap((layer) => layer.quantumOperations.map((op) => op.id)));

    return loopBlocks
        .map((block) => ({ ...block, operationIds: block.operationIds.filter((id) => present.has(id)) }))
        .filter((block) => block.operationIds.length > 0);
};

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
