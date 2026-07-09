import type { AddQuantumOperationRequest, MoveQuantumOperationRequest } from '../dto/circuit.ts';

/**
 * Abstraction over circuit mutation, so the editor doesn't depend on where the
 * circuit actually lives:
 *  - Web IDE: a REST adapter — the backend is the source of truth.
 *  - VSCode extension: a local adapter against the .qasm file.
 *
 * Methods are fire-and-forget (`void`): the web adapter pushes the updated
 * circuit through an injected setter, the local adapter mutates in place.
 */
export interface CircuitPort {
    addQubit(): void;
    deleteQubit(registerId: string, qubitIdx: number): void;
    deleteLastQubit(): void;
    resetCircuit(): void;
    deleteCircuit(): void;
    addQuantumOperation(payload: AddQuantumOperationRequest): void;
    moveQuantumOperation(payload: MoveQuantumOperationRequest): void;
    removeQuantumOperation(operationId: string): void;
}
