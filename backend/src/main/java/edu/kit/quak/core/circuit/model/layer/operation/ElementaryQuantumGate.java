package edu.kit.quak.core.circuit.model.layer.operation;

import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import java.util.List;
import lombok.Getter;
import lombok.NonNull;
import lombok.Setter;

@Getter
@Setter
public class ElementaryQuantumGate extends QuantumOperation {
    private double rotationAngle;

    public ElementaryQuantumGate(
            @NonNull QuantumOperationLibrary operationDefinition,
            boolean inverseForm,
            @NonNull List<ElementSelector> targetQubits,
            List<ElementSelector> controlQubits,
            double rotationAngle) {
        super(operationDefinition, inverseForm, targetQubits, controlQubits);
        this.rotationAngle = rotationAngle;
        if (operationDefinition.getDefinition().getType() != getClass()) {
            throw new IllegalArgumentException("Operation definition type is not an elementary quantum gate.");
        }
    }

    @Override
    public String toString() {
        return String.format("[ElementaryQuantumGate: %s (quantumOperationId=%s)]", getOperationDefinition(), getId());
    }
}
