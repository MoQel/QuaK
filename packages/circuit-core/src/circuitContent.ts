import type { CircuitResponse, LayerResponse, LoopBlockDto, RegisterResponse } from './dto/circuit.ts';

export interface CircuitContent {
    registers: RegisterResponse[];
    layers: LayerResponse[];
    loopBlocks?: LoopBlockDto[];
}

/**
 * The circuit without transient UI state: the DUMMY placeholder that only exists during a drag, and the layers left
 * empty without it. Needed before a circuit is saved or turned into code.
 */
export const toCircuitContent = (circuit: CircuitResponse): CircuitContent => {
    const layers = circuit.layers
        .map((layer) => ({
            quantumOperations: layer.quantumOperations.filter((op) => op.type !== 'DUMMY'),
        }))
        .filter((layer) => layer.quantumOperations.length > 0);

    // The frames have to travel with every save: the endpoint is full-replace, so omitting them means "this circuit has
    // none" and the first autosave after parsing a loop would wipe it.
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
const keepFramesOverExistingOperations = (loopBlocks: LoopBlockDto[], layers: LayerResponse[]): LoopBlockDto[] => {
    const present = new Set(layers.flatMap((layer) => layer.quantumOperations.map((op) => op.id)));

    return loopBlocks
        .map((block) => ({ ...block, operationIds: block.operationIds.filter((id) => present.has(id)) }))
        .filter((block) => block.operationIds.length > 0);
};
