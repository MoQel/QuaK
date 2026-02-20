package edu.kit.quak.core.circuit.model.layer.operation;

import edu.kit.quak.core.circuit.exceptions.EmptyClassicBitAssignmentException;
import edu.kit.quak.core.circuit.exceptions.MismatchedOperationTypeException;
import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import java.util.List;
import lombok.Getter;
import lombok.NonNull;
import lombok.Setter;

@Getter
@Setter
public class Measurement extends QuantumOperation {

    private List<ElementSelector> classicBits;

    public Measurement(
        @NonNull QuantumOperationLibrary operationDefinition,
        boolean inverseForm,
        @NonNull List<ElementSelector> targetQubits,
        List<ElementSelector> controlQubits,
        @NonNull List<ElementSelector> classicBits
    ) {
        super(operationDefinition, inverseForm, targetQubits, controlQubits);
        if (operationDefinition.getDefinition().getType() != getClass()) {
            throw new MismatchedOperationTypeException(getClass(), operationDefinition.getDefinition().getType());
        }
        if (classicBits.isEmpty()) {
            throw new EmptyClassicBitAssignmentException();
        }
        this.classicBits = classicBits;
    }

    @Override
    public String toString() {
        return String.format("[Measurement (quantumOperationId=%s)]", getId());
    }
}
