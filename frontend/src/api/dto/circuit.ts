// --- DTOs ---

import { OperationIdentifier } from '@/lib/operations.ts';

export interface ElementSelectorDto {
    registerId: string;
    index: number;
}

export const getSelectorKey = (sel: ElementSelectorDto): string => `${sel.registerId}-${sel.index}`;

export type QuantumOperationType = 'ELEMENTARY_QUANTUM_GATE' | 'MEASUREMENT' | 'DUMMY';

export interface AbstractQuantumOperationDto {
    id?: string; // Only for response
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
export type RegisterType = 'Quantum_Register' | 'Classic_Register';

// Constants — single source of truth for register type discriminator values
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
    classicBits?: ElementSelectorDto[];
}

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

/**
 * Computes the visual Y position (in pixels) of a qubit/bit within a register,
 * accounting for section headers, register headers and the gap between
 * the quantum and classical sections.
 */
export const getVisualY = (registers: RegisterResponse[], registerId: string, index: number): number => {
    let visualY = 0;
    let classicSectionStarted = false;

    for (const [regIdx, reg] of registers.entries()) {
        const previousRegister = regIdx > 0 ? registers[regIdx - 1] : undefined;
        const startsClassicSection = isClassicRegister(reg) && !classicSectionStarted;

        if (!previousRegister || startsClassicSection) {
            if (previousRegister) {
                visualY += 20; // REGISTER_SECTION_GAP
            }
            visualY += 24; // REGISTER_SECTION_HEADER_HEIGHT
        }

        const size = getRegisterSize(reg);
        if (reg.id === registerId) {
            return visualY + 28 + index * 48; // REGISTER_HEADER_HEIGHT + QUBIT_HEIGHT
        }

        if (isClassicRegister(reg)) {
            classicSectionStarted = true;
        }

        visualY += 28 + size * 48; // REGISTER_HEADER_HEIGHT + size * QUBIT_HEIGHT
    }

    return 0;
};
