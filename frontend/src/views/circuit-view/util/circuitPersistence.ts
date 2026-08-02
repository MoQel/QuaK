import { api } from '@/api/api.ts';
import { CircuitResponse, LoopBlockDto } from '@/api/dto/circuit.ts';

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
