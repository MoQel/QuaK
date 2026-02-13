package edu.kit.quak.core.circuit.model.layer.operation;

import edu.kit.quak.core.circuit.model.ElementWithId;
import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import java.util.List;
import lombok.Getter;
import lombok.NonNull;
import lombok.Setter;

@Getter
@Setter
public abstract class QuantumOperation extends ElementWithId {
    protected QuantumOperationLibrary operationDefinition;
    protected boolean inverseForm;
    protected List<ElementSelector> targetQubits;
    protected List<ElementSelector> controlQubits;

    protected QuantumOperation(
            @NonNull QuantumOperationLibrary operationDefinition,
            boolean inverseForm,
            @NonNull List<ElementSelector> targetQubits,
            List<ElementSelector> controlQubits) {
        super();
        this.operationDefinition = operationDefinition;
        this.inverseForm = inverseForm;
        if (targetQubits.isEmpty()) {
            throw new IllegalArgumentException("A quantum operation must have at least one target qubit.");
        }
        this.targetQubits = targetQubits;
        this.controlQubits = controlQubits;
    }
}
