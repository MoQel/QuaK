package edu.kit.quak.core.circuit.model.layer.operation.library;

import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.Measurement;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import lombok.Getter;

@Getter
public enum QuantumOperationLibrary {
    H(new ConcreteQuantumOperation<>(
            ElementaryQuantumGate.class,
            true,
            1,
            0,
            0,
            false
    )),

    X(new ConcreteQuantumOperation<>(
            ElementaryQuantumGate.class,
            true,
            1,
            0,
            0,
            false
    )),

    Y(new ConcreteQuantumOperation<>(
            ElementaryQuantumGate.class,
            true,
            1,
            0,
            0,
            false
    )),

    Z(new ConcreteQuantumOperation<>(
            ElementaryQuantumGate.class,
            true,
            1,
            0,
            0,
            false
    )),

    CX(new ConcreteQuantumOperation<>(
            ElementaryQuantumGate.class,
            true,
            1,
            1,
            0,
            false
    )),

    CZ(new ConcreteQuantumOperation<>(
            ElementaryQuantumGate.class,
            true,
            1,
            1,
            0,
            false
    )),

    SWAP(new ConcreteQuantumOperation<>(
            ElementaryQuantumGate.class,
            true,
            2,
            0,
            0,
            false
    )),

    CCX(new ConcreteQuantumOperation<>(
            ElementaryQuantumGate.class,
            true,
            1,
            2,
            0,
            false
    )),

    S(new ConcreteQuantumOperation<>(
            ElementaryQuantumGate.class,
            true,
            1,
            0,
            0,
            false
    )),

    T(new ConcreteQuantumOperation<>(
            ElementaryQuantumGate.class,
            true,
            1,
            0,
            0,
            false
    )),

    RX(new ConcreteQuantumOperation<>(
            ElementaryQuantumGate.class,
            true,
            1,
            0,
            0,
            true
    )),

    RY(new ConcreteQuantumOperation<>(
            ElementaryQuantumGate.class,
            true,
            1,
            0,
            0,
            true
    )),

    RZ(new ConcreteQuantumOperation<>(
            ElementaryQuantumGate.class,
            true,
            1,
            0,
            0,
            true
    )),

    MEASURE(new ConcreteQuantumOperation<>(
            Measurement.class,
            false,
            1,
            0,
            1,
            false
    ));

    private final QuantumOperationDefinition<? extends QuantumOperation> definition;

    QuantumOperationLibrary(QuantumOperationDefinition<? extends QuantumOperation> definition) {
        this.definition = definition;
    }

    public static QuantumOperationLibrary fromString(String value) {
        try {
            return QuantumOperationLibrary.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unknown quantum operation: " + value);
        }
    }

    @Override
    public String toString() {
        return name();
    }
}
