// Shared gate/operation type identifiers. Presentation (icons, colors, shapes)
// lives in the editor layer, not here.

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

export type QuantumOperationType = 'ELEMENTARY_QUANTUM_GATE' | 'MEASUREMENT' | 'DUMMY';

/**
 * How many qubits an operation consumes, and in which role. Domain, not
 * presentation: the editor draws gates with it, and the QASM transform needs it
 * to split an operand list. OpenQASM writes controls first, so `cx q[0], q[1]`
 * is only unambiguous if you know CX takes one control and one target.
 *
 * Mirrors the backend's `QuantumOperationLibrary` definitions; the fixture suite
 * is what keeps the two honest.
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
