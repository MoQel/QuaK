import { CompositeQuantumGateDto, QuantumOperationDto } from '@/api/dto/circuit.ts';
import { OperationIdentifier } from '@/lib/operations.ts';

export type UiLayer = {
    quantumOperations: UiQuantumOperation[];
};

export type UiQuantumOperation = QuantumOperationDto & {
    originalLayerIdx: number;
};

export type DragData = {
    origin: 'library' | 'circuit';
    /** A library gate's identifier, or a user-defined gate's own name when dragging a composite. */
    operationIdentifier: OperationIdentifier | string;
    id?: string;
    /**
     * The gate to insert, when a user-defined one is dragged in from the library.
     *
     * A custom gate has no entry in the built-in catalogue, so nothing at the drop site could look
     * up its arity or its body — the template has to travel with the drag. Absent for built-ins and
     * for anything dragged within the circuit, where the operation is already there to be found.
     */
    composite?: CompositeQuantumGateDto;
};

export type FlatQubit = {
    regId: string;
    regName: string;
    regIdx: number;
    relQubitIdx: number;
    absQubitIdx: number;
};

export type HoverPos = {
    qubitIdx: number;
    layerIdx: number;
};
