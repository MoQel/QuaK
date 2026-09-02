import { OperationIdentifier } from '@/lib/operations.ts';

export interface ElementSelectorDto {
    registerId: string;
    index: number;
}

export const getSelectorKey = (sel: ElementSelectorDto): string => `${sel.registerId}-${sel.index}`;

export type QuantumOperationType =
    | 'ELEMENTARY_QUANTUM_GATE'
    | 'MEASUREMENT'
    | 'SUBCIRCUIT_OPERATION'
    | 'COMPOSITE_QUANTUM_GATE'
    | 'DUMMY';

export interface AbstractQuantumOperationDto {
    id?: string;
    type: QuantumOperationType;
    /**
     * A library gate's name for built-in operations. A composite carries its user-defined gate
     * name here instead, which is why `type` — not this field — decides how an operation renders.
     */
    identifier: OperationIdentifier | string;
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

/**
 * A call to a subcircuit: the definition lives in another circuit of the project, referenced by id
 * rather than embedded here.
 */
export interface SubcircuitOperationDto extends AbstractQuantumOperationDto {
    type: 'SUBCIRCUIT_OPERATION';
    definitionCircuitId: string;
    /**
     * Name of the referenced circuit's file, filled in by the backend on read. Absent when the
     * reference cannot be resolved — the box then falls back to a short form of the id.
     */
    definitionName?: string;
}

/**
 * A call to a user-defined gate, drawn as a single box spanning its wires.
 *
 * `targetQubits` holds every qubit of the call in the gate's parameter order, so position *i*
 * belongs to port `portLabels[i]`. The box therefore spans from the topmost to the bottommost of
 * them even when the call skips wires in between.
 */
export interface CompositeQuantumGateDto extends AbstractQuantumOperationDto {
    type: 'COMPOSITE_QUANTUM_GATE';
    /** Port labels in `targetQubits` order, e.g. `["a", "b"]`. */
    portLabels: string[];
    /**
     * Positions in `targetQubits` the gate body actually acts on; a declared but unused parameter
     * is absent. Analysis information only — the box still draws a port for every parameter.
     */
    usedQubitPositions: number[];
    /** What the gate is made of, one level deep and already bound to this call's qubits. */
    body: QuantumOperationDto[];
}

export interface DummyDto extends AbstractQuantumOperationDto {
    type: 'DUMMY';
}

export type QuantumOperationDto =
    | ElementaryQuantumGateDto
    | MeasurementDto
    | SubcircuitOperationDto
    | CompositeQuantumGateDto
    | DummyDto;

export const isCompositeGate = (op: QuantumOperationDto): op is CompositeQuantumGateDto =>
    op.type === 'COMPOSITE_QUANTUM_GATE';

export const isSubcircuit = (op: QuantumOperationDto): op is SubcircuitOperationDto =>
    op.type === 'SUBCIRCUIT_OPERATION';

/** Either way of composing a circuit; both are drawn as one box rather than as target/control markers. */
export const isComposedOperation = (op: QuantumOperationDto): op is CompositeQuantumGateDto | SubcircuitOperationDto =>
    isCompositeGate(op) || isSubcircuit(op);

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

export const getVisualY = (registers: RegisterResponse[], registerId: string, index: number): number => {
    let visualY = 0;
    let classicSectionStarted = false;

    for (const [regIdx, reg] of registers.entries()) {
        const previousRegister = regIdx > 0 ? registers[regIdx - 1] : undefined;
        const startsClassicSection = isClassicRegister(reg) && !classicSectionStarted;

        if (!previousRegister || startsClassicSection) {
            if (previousRegister) {
                visualY += 20;
            }
        }

        const size = getRegisterSize(reg);
        if (reg.id === registerId) {
            return visualY + 28 + index * 48;
        }

        if (isClassicRegister(reg)) {
            classicSectionStarted = true;
        }

        visualY += 28 + size * 48;
    }

    return 0;
};
