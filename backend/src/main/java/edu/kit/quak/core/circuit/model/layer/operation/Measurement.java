package edu.kit.quak.core.circuit.model.layer.operation;

import edu.kit.quak.core.circuit.exceptions.InvalidOperationConfigurationException;
import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import java.util.List;
import lombok.Getter;
import lombok.NonNull;

@Getter
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
            throw new InvalidOperationConfigurationException(
                "Operation type mismatch: expected %s but got %s".formatted(getClass(), operationDefinition.getDefinition().getType())
            );
        }
        if (targetQubits.size() != 1) {
            throw new InvalidOperationConfigurationException("A measurement operation must target exactly one qubit.");
        }
        if (inverseForm) {
            throw new InvalidOperationConfigurationException("A measurement operation cannot be inverted.");
        }
        if (controlQubits != null && !controlQubits.isEmpty()) {
            throw new InvalidOperationConfigurationException("A measurement operation cannot be controlled.");
        }
        setClassicBits(classicBits);
    }

    @Override
    public void setInverseForm(boolean inverseForm) {
        if (inverseForm) {
            throw new InvalidOperationConfigurationException("A measurement operation cannot be inverted.");
        }
        this.inverseForm = false;
    }

    @Override
    public void setControlQubits(List<ElementSelector> controlQubits) {
        if (controlQubits != null && !controlQubits.isEmpty()) {
            throw new InvalidOperationConfigurationException("A measurement operation cannot be controlled.");
        }
        this.controlQubits = List.of();
    }

    public void setClassicBits(@NonNull List<ElementSelector> classicBits) {
        if (classicBits.isEmpty()) {
            throw new InvalidOperationConfigurationException("A measurement operation must assign its result to at least one classic bit.");
        }
        this.classicBits = List.copyOf(classicBits);
    }

    @Override
    public String toString() {
        return String.format("[Measurement (quantumOperationId=%s)]", getId());
    }
}
