package edu.kit.quak.core.circuit.model.layer.operation;

import edu.kit.quak.core.circuit.exceptions.InvalidOperationConfigurationException;
import java.util.List;
import lombok.Getter;
import lombok.NonNull;
import lombok.Setter;

@Getter
@Setter
public class CompositeQuantumOperation extends QuantumOperation {

    private String definitionCircuitId;

    public CompositeQuantumOperation(
        boolean inverseForm,
        @NonNull List<ElementSelector> targetQubits,
        List<ElementSelector> controlQubits,
        @NonNull String definitionCircuitId
    ) {
        super(inverseForm, targetQubits, controlQubits);
        if (definitionCircuitId.isBlank()) {
            throw new InvalidOperationConfigurationException("A composite quantum operation must have a valid definitionCircuitId.");
        }
        this.definitionCircuitId = definitionCircuitId;
    }

    @Override
    public String toString() {
        return String.format("[CompositeQuantumOperation: definitionCircuitId=%s (quantumOperationId=%s)]", definitionCircuitId, getId());
    }
}
