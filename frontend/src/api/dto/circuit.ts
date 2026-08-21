// --- DTOs ---

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
    id?: string; // Only for response
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

export interface MeasurementDto extends AbstractQuantumOperationDto {
    type: 'MEASUREMENT';
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

// Temporary placeholder only — must never appear in a finalized or submitted circuit.
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

// --- Responses ---
type RegisterType = 'Quantum_Register' | 'Classic_Register';

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
    return reg.type === 'Quantum_Register';
};

export const isClassicRegister = (reg: RegisterResponse): reg is ClassicRegisterResponse => {
    return reg.type === 'Classic_Register';
};

export const getCircuitWidth = (circuitData: CircuitResponse): number => {
    return circuitData.registers.reduce((sum, reg) => {
        return isQuantumRegister(reg) ? sum + reg.numberOfQubits : sum;
    }, 0);
};

export interface LayerResponse {
    quantumOperations: QuantumOperationDto[];
}

/**
 * A repetition frame: the `×n` box drawn *around* part of the circuit.
 *
 * Unlike a composite gate this is not an operation and does not live in a layer — the operations it
 * covers stay in their layers and stay individually editable. It therefore carries no geometry: the
 * frame is derived as the bounding box of `operationIds`, wherever those operations currently sit,
 * which is what keeps it correct across re-scheduling.
 */
export interface LoopBlockDto {
    id: string;
    /** How often the covered body runs. Always at least 2. */
    repeatCount: number;
    /** The covered operations in program order, referencing operation ids in `layers`. */
    operationIds: string[];
}

export interface CircuitResponse {
    id: string;
    registers: RegisterResponse[];
    layers: LayerResponse[];
    loopBlocks?: LoopBlockDto[];
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
