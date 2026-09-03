package edu.kit.quak.core.circuit.model.layer.operation;

import edu.kit.quak.core.circuit.exceptions.InvalidOperationConfigurationException;
import java.util.List;
import lombok.Getter;
import lombok.NonNull;
import lombok.Setter;

@Getter
@Setter
public class SubcircuitOperation extends QuantumOperation {

    private String definitionCircuitId;

    /**
     * Name of the referenced circuit's file, when the caller knows it.
     *
     * <p>Not persisted and not part of the reference - the id is what identifies the circuit. This
     * only lets code generation name the gate after the file instead of after a sanitized UUID, and
     * is simply absent when nothing resolved it.
     */
    private String definitionName;

    public SubcircuitOperation(
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
    public SubcircuitOperation copyForQubits(@NonNull List<ElementSelector> targetQubits, @NonNull List<ElementSelector> controlQubits) {
        return new SubcircuitOperation(inverseForm, copySelectors(targetQubits), copySelectors(controlQubits), definitionCircuitId);
    }

    /**
     * Two calls are alike only when they point at the same circuit.
     *
     * <p>Without this, a loop body calling different subcircuits would compare equal and collapse
     * into one framed repetition that runs the wrong one - the same reason a composite gate compares
     * by definition id.
     */
    @Override
    public boolean isStructurallyEqualTo(QuantumOperation other) {
        return (
            super.isStructurallyEqualTo(other) &&
            java.util.Objects.equals(definitionCircuitId, ((SubcircuitOperation) other).definitionCircuitId)
        );
    }

    @Override
    public String toString() {
        return String.format("[SubcircuitOperation: definitionCircuitId=%s (quantumOperationId=%s)]", definitionCircuitId, getId());
    }
}
