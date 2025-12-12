package edu.kit.quak.core.circuit.model.operation;

public enum ElementaryQuantumGateType {
    H,
    X,
    Y,
    Z,
    CNOT,
    CCX,
    CZ,
    SWAP,
    S,
    T,
    RX,
    RY,
    RZ,
    MEASURE;

    public static ElementaryQuantumGateType fromString(String value) {
        try {
            return ElementaryQuantumGateType.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unknown gate type: " + value);
        }
    }
}
