// Circuit DTOs shared by the web IDE, the extension and the QASM transform.

import type { GateIdentifier, QuantumOperationType } from '../gate-types.ts';

export interface ElementSelectorDto {
    registerId: string;
    index: number;
}

export const getSelectorKey = (sel: ElementSelectorDto): string => `${sel.registerId}-${sel.index}`;

export interface AbstractQuantumOperationDto {
    id: string;
    type: QuantumOperationType;
    /**
     * A library gate's name for built-in operations. A composite carries its user-defined gate
     * name here instead, which is why `type` — not this field — decides how an operation renders.
     */
    identifier: GateIdentifier;
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
    /**
     * What the referenced circuit does, already bound to this call's qubits, filled in by the
     * backend on read. Absent when the contents cannot be expressed in the caller's qubits -- a
     * circuit that measures, or a call passing too few qubits -- and consumers must then say so
     * rather than quietly leave the gate out.
     */
    body?: QuantumOperationDto[];
    /**
     * The 0-based indices of the subcircuit's qubits mapped to the call's targetQubits.
     * When undefined or empty, defaults to sequential [0, 1, ..., targetQubits.length - 1].
     */
    subcircuitQubitIndices?: number[];
    /**
     * Reason why body could not be bound (e.g., entangled with unmapped qubits or missing measurements).
     */
    bindingError?: string;
}

/** A circuit of the project that can be dropped in as a subcircuit. Mirrors the backend response. */
export interface SubcircuitOption {
    circuitId: string;
    /** The file holding the circuit, so it can be opened for editing. */
    fileId: string;
    /** The file the circuit belongs to; what the box is labelled with. */
    name: string;
    qubitCount: number;
    /** Zero for a circuit that exists but is still empty — dropping it in would do nothing. */
    operationCount: number;
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
