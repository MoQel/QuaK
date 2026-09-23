package edu.kit.quak.core.circuit.model.layer.operation;

import edu.kit.quak.core.circuit.exceptions.InvalidOperationConfigurationException;
import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import java.util.List;
import lombok.Getter;
import lombok.NonNull;
import lombok.Setter;

@Getter
@Setter
public class ElementaryQuantumGate extends QuantumOperation {

    private QuantumOperationLibrary operationDefinition;
    private double rotationAngle;

    public ElementaryQuantumGate(
        @NonNull QuantumOperationLibrary operationDefinition,
        boolean inverseForm,
        @NonNull List<ElementSelector> targetQubits,
        List<ElementSelector> controlQubits,
        double rotationAngle
    ) {
        super(inverseForm, targetQubits, controlQubits);
        this.operationDefinition = operationDefinition;
        this.rotationAngle = rotationAngle;
        if (operationDefinition.getDefinition().getType() != getClass()) {
            throw new InvalidOperationConfigurationException(
                "Operation type mismatch: expected %s but got %s".formatted(getClass(), operationDefinition.getDefinition().getType())
            );
        }
    }

    @Override
    public ElementaryQuantumGate copyForQubits(@NonNull List<ElementSelector> targetQubits, @NonNull List<ElementSelector> controlQubits) {
        return new ElementaryQuantumGate(
            operationDefinition,
            inverseForm,
            copySelectors(targetQubits),
            copySelectors(controlQubits),
            rotationAngle
        );
    }

    /** Same gate on the same qubits, and — for rx/ry/rz — turned by the same angle. */
    @Override
    public boolean isStructurallyEqualTo(QuantumOperation other) {
        // operationDefinition is compared here rather than on the base class: it moved down to the
        // subclasses that actually have one, so two X gates and two H gates no longer look alike.
        ElementaryQuantumGate gate = (ElementaryQuantumGate) other;
        return (
            super.isStructurallyEqualTo(other) &&
            operationDefinition == gate.operationDefinition &&
            Double.compare(rotationAngle, gate.rotationAngle) == 0
        );
    }

    @Override
    public String toString() {
        return String.format("[ElementaryQuantumGate: %s (quantumOperationId=%s)]", getOperationDefinition(), getId());
    }
}
