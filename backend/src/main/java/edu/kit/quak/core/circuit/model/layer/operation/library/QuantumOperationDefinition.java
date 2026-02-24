package edu.kit.quak.core.circuit.model.layer.operation.library;

import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import lombok.Getter;
import lombok.NonNull;
import lombok.Setter;

@Getter
@Setter
public abstract class QuantumOperationDefinition<T extends QuantumOperation> {

    private Class<T> type;
    private boolean reversible;
    private int targetQubits;
    private int controlQubits;

    protected QuantumOperationDefinition(@NonNull Class<T> type, boolean reversible, int targetQubits, int controlQubits) {
        this.type = type;
        this.reversible = reversible;
        this.targetQubits = targetQubits;
        this.controlQubits = controlQubits;
    }
}
