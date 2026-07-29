import type { CircuitResponse, LayerResponse, RegisterResponse } from './dto/circuit.ts';

export interface CircuitContent {
    registers: RegisterResponse[];
    layers: LayerResponse[];
}

/**
 * The circuit stripped of transient UI state: the DUMMY drop placeholder only
 * exists while a drag is in flight, and layers left empty by removing it carry
 * no meaning either.
 *
 * Anything that turns a circuit into something durable needs this first — the
 * web IDE before it saves or asks the backend for code, the extension before it
 * generates QASM for the document.
 */
export const toCircuitContent = (circuit: CircuitResponse): CircuitContent => ({
    registers: circuit.registers,
    layers: circuit.layers
        .map((layer) => ({
            quantumOperations: layer.quantumOperations.filter((op) => op.type !== 'DUMMY'),
        }))
        .filter((layer) => layer.quantumOperations.length > 0),
});
