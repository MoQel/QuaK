package edu.kit.quak.core.circuit.model.layer.operation.library;

import edu.kit.quak.core.circuit.model.layer.operation.Measurement;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import lombok.Getter;
import lombok.NonNull;
import lombok.Setter;

@Getter
@Setter
public class ConcreteQuantumOperation<T extends QuantumOperation> extends QuantumOperationDefinition<T> {
    private int classicBits;
    private boolean hasRotationAngle;

    protected ConcreteQuantumOperation(@NonNull Class<T> type,
                                       boolean reversible,
                                       int targetQubits,
                                       int controlQubits,
                                       int classicBits,
                                       boolean hasRotationAngle) {
        super(type, reversible, targetQubits, controlQubits);
        if (type != Measurement.class && classicBits != 0) {
            throw new IllegalArgumentException("Classic bits are only allowed for type Measurement!");
        }
        this.classicBits = classicBits;
        this.hasRotationAngle = hasRotationAngle;
    }
}
