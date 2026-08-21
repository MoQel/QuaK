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

    /**
     * A subcircuit call is fully described by the circuit it points at, so the copy only needs fresh
     * selectors: they are mutable and must never be shared with the original.
     */
    @Override
    public CompositeQuantumOperation copyForQubits(
        @NonNull List<ElementSelector> targetQubits,
        @NonNull List<ElementSelector> controlQubits
    ) {
        return new CompositeQuantumOperation(inverseForm, copySelectors(targetQubits), copySelectors(controlQubits), definitionCircuitId);
    }

    @Override
    public String toString() {
        return String.format("[CompositeQuantumOperation: definitionCircuitId=%s (quantumOperationId=%s)]", definitionCircuitId, getId());
    }
}
