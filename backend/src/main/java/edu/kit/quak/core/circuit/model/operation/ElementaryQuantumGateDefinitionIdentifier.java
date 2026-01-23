package edu.kit.quak.core.circuit.model.operation;

public enum ElementaryQuantumGateDefinitionIdentifier {
    H,
    X,
    Y,
    Z,
    CX,
    CCX,
    CZ,
    SWAP,
    S,
    T,
    RX,
    RY,
    RZ,
    MEASURE; // TODO: Implement Measurement as an own subclass of QuantumOperation (see meta model)

    public static ElementaryQuantumGateDefinitionIdentifier fromString(String value) {
        try {
            return ElementaryQuantumGateDefinitionIdentifier.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unknown gate definition identifier: " + value);
        }
    }
}
