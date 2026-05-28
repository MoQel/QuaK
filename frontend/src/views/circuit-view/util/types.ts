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
    operationIdentifier: OperationIdentifier;
    id?: string;
};

export type FlatQubit = {
    regId: string;
    regName: string;
    regIdx: number;
    relQubitIdx: number;
    absQubitIdx: number;
    regType: 'Quantum_Register' | 'Classic_Register';
    /** Absolute Y position in pixels, accounting for preceding register headers. */
    visualY: number;
};

export type HoverPos = {
    qubitIdx: number;
    layerIdx: number;
};
