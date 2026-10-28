// Gate and operation identifiers. Presentation (icons, colors, shapes) lives in circuit-editor.

export type OperationIdentifier =
    | 'H'
    | 'X'
    | 'Y'
    | 'Z'
    | 'CX'
    | 'CCX'
    | 'CZ'
    | 'SWAP'
    | 'S'
    | 'T'
    | 'RX'
    | 'RY'
    | 'RZ'
    | 'MEASURE'
    | 'DUMMY';

/**
 * A built-in identifier or a user-defined gate's name. `string & Record<never, never>` instead of `string` keeps the
 * built-in names in autocomplete, which a plain union with `string` would drop.
 */
export type GateIdentifier = OperationIdentifier | (string & Record<never, never>);

export type QuantumOperationType =
    | 'ELEMENTARY_QUANTUM_GATE'
    | 'MEASUREMENT'
    | 'SUBCIRCUIT_OPERATION'
    | 'COMPOSITE_QUANTUM_GATE'
    | 'DUMMY';

/**
 * How many qubits an operation takes, and in which role. OpenQASM lists controls first, so the QASM transform needs
 * this to split an operand list. Mirrors the backend's `QuantumOperationLibrary`.
 */
export interface GateArity {
    type: QuantumOperationType;
    targetSize: number;
    controlSize: number;
    totalSize: number;
    /** Parametric rotation gate (rx/ry/rz): carries an angle. */
    hasRotationAngle?: boolean;
}

export const GATE_ARITY: Record<OperationIdentifier, GateArity> = {
    H: { type: 'ELEMENTARY_QUANTUM_GATE', targetSize: 1, controlSize: 0, totalSize: 1 },
    X: { type: 'ELEMENTARY_QUANTUM_GATE', targetSize: 1, controlSize: 0, totalSize: 1 },
    Y: { type: 'ELEMENTARY_QUANTUM_GATE', targetSize: 1, controlSize: 0, totalSize: 1 },
    Z: { type: 'ELEMENTARY_QUANTUM_GATE', targetSize: 1, controlSize: 0, totalSize: 1 },
    CX: { type: 'ELEMENTARY_QUANTUM_GATE', targetSize: 1, controlSize: 1, totalSize: 2 },
    CCX: { type: 'ELEMENTARY_QUANTUM_GATE', targetSize: 1, controlSize: 2, totalSize: 3 },
    CZ: { type: 'ELEMENTARY_QUANTUM_GATE', targetSize: 1, controlSize: 1, totalSize: 2 },
    SWAP: { type: 'ELEMENTARY_QUANTUM_GATE', targetSize: 2, controlSize: 0, totalSize: 2 },
    S: { type: 'ELEMENTARY_QUANTUM_GATE', targetSize: 1, controlSize: 0, totalSize: 1 },
    T: { type: 'ELEMENTARY_QUANTUM_GATE', targetSize: 1, controlSize: 0, totalSize: 1 },
    RX: { type: 'ELEMENTARY_QUANTUM_GATE', targetSize: 1, controlSize: 0, totalSize: 1, hasRotationAngle: true },
    RY: { type: 'ELEMENTARY_QUANTUM_GATE', targetSize: 1, controlSize: 0, totalSize: 1, hasRotationAngle: true },
    RZ: { type: 'ELEMENTARY_QUANTUM_GATE', targetSize: 1, controlSize: 0, totalSize: 1, hasRotationAngle: true },
    MEASURE: { type: 'MEASUREMENT', targetSize: 1, controlSize: 0, totalSize: 1 },
    DUMMY: { type: 'DUMMY', targetSize: 1, controlSize: 0, totalSize: 1 },
};

/** Narrows an arbitrary string (e.g. a gate name from parsed QASM) to a known identifier. */
export const toOperationIdentifier = (name: string): OperationIdentifier | null => {
    const normalized = name.toUpperCase();
    return normalized in GATE_ARITY ? (normalized as OperationIdentifier) : null;
};
