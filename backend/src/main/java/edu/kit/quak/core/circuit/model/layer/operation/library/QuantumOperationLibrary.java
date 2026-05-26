package edu.kit.quak.core.circuit.model.layer.operation.library;

import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.Measurement;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import lombok.Getter;

@Getter
public enum QuantumOperationLibrary {
    H(new ConcreteQuantumOperation<>(ElementaryQuantumGate.class, true, 1, 0, 0, false)),

    X(new ConcreteQuantumOperation<>(ElementaryQuantumGate.class, true, 1, 0, 0, false)),

    Y(new ConcreteQuantumOperation<>(ElementaryQuantumGate.class, true, 1, 0, 0, false)),

    Z(new ConcreteQuantumOperation<>(ElementaryQuantumGate.class, true, 1, 0, 0, false)),

    CX(new ConcreteQuantumOperation<>(ElementaryQuantumGate.class, true, 1, 1, 0, false)),

    CZ(new ConcreteQuantumOperation<>(ElementaryQuantumGate.class, true, 1, 1, 0, false)),

    SWAP(new ConcreteQuantumOperation<>(ElementaryQuantumGate.class, true, 2, 0, 0, false)),

    CCX(new ConcreteQuantumOperation<>(ElementaryQuantumGate.class, true, 1, 2, 0, false)),

    S(new ConcreteQuantumOperation<>(ElementaryQuantumGate.class, true, 1, 0, 0, false)),

    T(new ConcreteQuantumOperation<>(ElementaryQuantumGate.class, true, 1, 0, 0, false)),

    RX(new ConcreteQuantumOperation<>(ElementaryQuantumGate.class, true, 1, 0, 0, true)),

    RY(new ConcreteQuantumOperation<>(ElementaryQuantumGate.class, true, 1, 0, 0, true)),

    RZ(new ConcreteQuantumOperation<>(ElementaryQuantumGate.class, true, 1, 0, 0, true)),

    MEASURE(new ConcreteQuantumOperation<>(Measurement.class, false, 1, 0, 1, false));

    private final QuantumOperationDefinition<? extends QuantumOperation> definition;

    QuantumOperationLibrary(QuantumOperationDefinition<? extends QuantumOperation> definition) {
        this.definition = definition;
    }

    @Override
    public String toString() {
        return name();
    }

    public String toCode(QuantumCircuit quantumCircuit) {
        return switch (this) {
            case H -> "h";
            case X -> "x";
            case Y -> "y";
            case Z -> "z";
            case CX -> "cx";
            case CZ -> "cz";
            case SWAP -> "swap";
            case CCX -> "ccx";
            case S -> "s";
            case T -> "t";
            // TODO Für Rotations-Gates musst du später vermutlich Parameter anhängen:
            case RX -> "rx";
            case RY -> "ry";
            case RZ -> "rz";
            case MEASURE -> "measure";
        };
    }
}
