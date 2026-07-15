import { QuantumOperationDto } from '@quak/circuit-core';

export type UiLayer = {
    quantumOperations: UiQuantumOperation[];
};

export type UiQuantumOperation = QuantumOperationDto & {
    originalLayerIdx: number;
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
