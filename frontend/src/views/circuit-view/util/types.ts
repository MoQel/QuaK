import { QuantumOperationDto } from '@/api/dto/circuit.ts';
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
