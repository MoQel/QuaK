import { QuantumOperationDto, RegisterType } from '@quak/circuit-core';

export type RegisterSection = 'quantum' | 'classic';

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
    regType: RegisterType;
    section: RegisterSection;
    headerY: number;
    registerSize: number;
    isCollapsed: boolean;
    visualY: number;
};

export type HoverPos = {
    qubitIdx: number;
    layerIdx: number;
};
