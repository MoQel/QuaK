package edu.kit.quak.core.circuit.model.layer.operation;

import edu.kit.quak.core.circuit.exceptions.InvalidOperationConfigurationException;
import edu.kit.quak.core.circuit.model.ElementWithId;
import java.util.List;
import lombok.Getter;
import lombok.NonNull;
import lombok.Setter;

@Getter
@Setter
public abstract class QuantumOperation extends ElementWithId {

    protected boolean inverseForm;
    protected List<ElementSelector> targetQubits;
    protected List<ElementSelector> controlQubits;

    protected QuantumOperation(boolean inverseForm, @NonNull List<ElementSelector> targetQubits, List<ElementSelector> controlQubits) {
        super();
        this.inverseForm = inverseForm;
        if (targetQubits.isEmpty()) {
            throw new InvalidOperationConfigurationException("Must provide at least one qubit to target.");
        }
        this.targetQubits = targetQubits;
        this.controlQubits = controlQubits;
    }
}
