// --- DTOs ---

import { OperationIdentifier } from '@/api/dto/OperationDefinition.ts';

export interface ElementSelectorDto {
    registerId: string;
    index: number;
}

export const getSelectorKey = (sel: ElementSelectorDto): string => `${sel.registerId}-${sel.index}`;

export type QuantumOperationType = 'ELEMENTARY_QUANTUM_GATE' | 'MEASUREMENT' | 'DUMMY';

export interface AbstractQuantumOperationDto {
    id?: string; // Only for response
    type: QuantumOperationType;
    operationDefinition: OperationIdentifier;
    inverseForm: boolean;
    targetQubits: ElementSelectorDto[];
    controlQubits: ElementSelectorDto[];
}

export interface ElementaryQuantumGateDto extends AbstractQuantumOperationDto {
    type: 'ELEMENTARY_QUANTUM_GATE';
    rotationAngle: number;
}

export interface MeasurementDto extends AbstractQuantumOperationDto {
    type: 'MEASUREMENT';
    classicBits: ElementSelectorDto[];
}

// Temporary placeholder only — must never appear in a finalized or submitted circuit.
export interface DummyDto extends AbstractQuantumOperationDto {
    type: 'DUMMY';
}

export type QuantumOperationDto = ElementaryQuantumGateDto | MeasurementDto | DummyDto;

export const getInvolvedSelectors = (op: QuantumOperationDto): ElementSelectorDto[] => {
    const selectors = [...op.targetQubits];
    if (op.controlQubits) {
        selectors.push(...op.controlQubits);
    }
    return selectors;
};

// --- Responses ---

export interface AbstractRegisterResponse {
    id: string;
    name: string;
}

export interface ClassicRegisterResponse extends AbstractRegisterResponse {
    numberOfBits: number;
}

export interface QuantumRegisterResponse extends AbstractRegisterResponse {
    numberOfQubits: number;
}

export type RegisterResponse = ClassicRegisterResponse | QuantumRegisterResponse;

export const getRegisterSize = (reg: RegisterResponse): number => {
    if ('numberOfQubits' in reg) return reg.numberOfQubits;
    if ('numberOfBits' in reg) return reg.numberOfBits;
    return 0;
};

export interface LayerResponse {
    quantumOperations: QuantumOperationDto[];
}

export interface CircuitResponse {
    id: string;
    registers: RegisterResponse[];
    layers: LayerResponse[];
}

// --- Requests ---

export interface AddQuantumOperationRequest {
    quantumOperation: QuantumOperationDto;
    layerIdx: number;
}

export interface MoveQuantumOperationRequest {
    quantumOperationId: string;
    layerIdx: number;
    targetQubits: ElementSelectorDto[];
    controlQubits: ElementSelectorDto[];
}
