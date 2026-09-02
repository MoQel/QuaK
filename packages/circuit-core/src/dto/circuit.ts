// Circuit DTOs shared by the web IDE, the extension and the QASM transform.

import type { OperationIdentifier, QuantumOperationType } from '../gate-types.ts';

export interface ElementSelectorDto {
    registerId: string;
    index: number;
}

export const getSelectorKey = (sel: ElementSelectorDto): string => `${sel.registerId}-${sel.index}`;

export interface AbstractQuantumOperationDto {
    id: string;
    type: QuantumOperationType;
    identifier: OperationIdentifier;
    inverseForm: boolean;
    targetQubits: ElementSelectorDto[];
    controlQubits: ElementSelectorDto[];
}

export interface ElementaryQuantumGateDto extends AbstractQuantumOperationDto {
    type: 'ELEMENTARY_QUANTUM_GATE';
    rotationAngle: number;
}

export interface MeasurementDto extends Omit<AbstractQuantumOperationDto, 'inverseForm' | 'controlQubits'> {
    type: 'MEASUREMENT';
    inverseForm: false;
    controlQubits: [];
    classicBits: ElementSelectorDto[];
}

// Temporary placeholder only. It must never appear in a finalized or submitted circuit.
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

export type RegisterType = 'Quantum_Register' | 'Classic_Register';

export const REGISTER_TYPE_QUANTUM = 'Quantum_Register' as const;
export const REGISTER_TYPE_CLASSIC = 'Classic_Register' as const;

export interface AbstractRegisterResponse {
    id: string;
    name: string;
    type: RegisterType;
}

export interface ClassicRegisterResponse extends AbstractRegisterResponse {
    type: 'Classic_Register';
    numberOfBits: number;
}

export interface QuantumRegisterResponse extends AbstractRegisterResponse {
    type: 'Quantum_Register';
    numberOfQubits: number;
}

export type RegisterResponse = ClassicRegisterResponse | QuantumRegisterResponse;

export const getRegisterSize = (reg: RegisterResponse): number => {
    if (isQuantumRegister(reg)) return reg.numberOfQubits;
    if (isClassicRegister(reg)) return reg.numberOfBits;
    return 0;
};

export const isQuantumRegister = (reg: RegisterResponse): reg is QuantumRegisterResponse => {
    return reg.type === REGISTER_TYPE_QUANTUM;
};

export const isClassicRegister = (reg: RegisterResponse): reg is ClassicRegisterResponse => {
    return reg.type === REGISTER_TYPE_CLASSIC;
};

export const getCircuitWidth = (circuitData: CircuitResponse): number => {
    return circuitData.registers.reduce((sum, reg) => {
        return isQuantumRegister(reg) ? sum + reg.numberOfQubits : sum;
    }, 0);
};

export interface LayerResponse {
    quantumOperations: QuantumOperationDto[];
}

export interface CircuitResponse {
    id: string;
    registers: RegisterResponse[];
    layers: LayerResponse[];
}

/** Places a new operation into the given layer. */
export interface AddQuantumOperationRequest {
    quantumOperation: QuantumOperationDto;
    layerIdx: number;
}

/** A drag that moves an existing operation to a new layer and qubit position. */
export interface MoveQuantumOperationRequest {
    quantumOperationId: string;
    layerIdx: number;
    targetQubits: ElementSelectorDto[];
    controlQubits: ElementSelectorDto[];
    classicBits?: ElementSelectorDto[];
}

/** Creates a register of the given kind; `size` is qubits or bits depending on `type`. */
export interface RegisterRequest {
    name: string;
    type: RegisterType;
    size: number;
}

export const getClassicCircuitWidth = (circuitData: CircuitResponse): number => {
    return circuitData.registers.reduce((sum, reg) => {
        return isClassicRegister(reg) ? sum + reg.numberOfBits : sum;
    }, 0);
};

export { type QuantumOperationType } from '../gate-types.ts';
