package edu.kit.quak.core.circuit.model.layer;

import edu.kit.quak.core.circuit.model.ElementWithId;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import lombok.NonNull;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Layer extends ElementWithId {
    private final List<QuantumOperation> quantumOperations;

    public Layer(@NonNull List<QuantumOperation> quantumOperations) {
        this.quantumOperations = new ArrayList<>(quantumOperations);
    }

    public void addQuantumOperation(@NonNull QuantumOperation operation) {
        quantumOperations.add(operation);
    }

    public void removeQuantumOperation(@NonNull QuantumOperation operation) {
        quantumOperations.remove(operation);
    }

    public List<QuantumOperation> getQuantumOperations() {
        return Collections.unmodifiableList(quantumOperations);
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("Layer\n");

        if (quantumOperations.isEmpty()) {
            sb.append("  <empty>");
        } else {
            quantumOperations.forEach(op ->
                    sb.append("  ")
                            .append(op.toString().replace("\n", "\n  "))
                            .append("\n")
            );
        }

        return sb.toString().trim();
    }
}
