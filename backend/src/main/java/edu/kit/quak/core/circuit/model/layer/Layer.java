package edu.kit.quak.core.circuit.model.layer;

import edu.kit.quak.core.circuit.model.ElementWithId;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import lombok.NonNull;

public class Layer extends ElementWithId {

    private final List<QuantumOperation> quantumOperations;

    public Layer(@NonNull List<QuantumOperation> quantumOperations) {
        this.quantumOperations = new ArrayList<>(quantumOperations);
    }

    /**
     * Adds a quantum operation to this layer.
     * * Note: New operations are prepended to the beginning of the operation list.
     * This ensures that during the {@code reorganizeCircuit()} method in {@link QuantumCircuit},
     * the most recently added operation takes priority when occupying available qubit slots.
     *
     * @param operation The quantum operation to be added.
     */
    public void addQuantumOperation(@NonNull QuantumOperation operation) {
        // Insert at index 0 to ensure priority during the circuit reorganization.
        quantumOperations.addFirst(operation);
    }

    public void removeQuantumOperation(@NonNull QuantumOperation operation) {
        quantumOperations.remove(operation);
    }

    public void clearQuantumOperations() {
        quantumOperations.clear();
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
            quantumOperations.forEach(op -> sb.append("  ").append(op.toString().replace("\n", "\n  ")).append("\n"));
        }

        return sb.toString().trim();
    }

    public String toCode(QuantumCircuit quantumCircuit) {
        //TODO rotation angle aus Elementary holen falls vorhanden
        StringBuilder code = new StringBuilder();
        // Emit operations in canonical order (topmost involved qubit first) so that
        // generating code and re-parsing it yields a stable circuit layout.
        List<QuantumOperation> sortedOperations = quantumOperations
            .stream()
            .sorted(Comparator.comparingInt(Layer::minInvolvedQubitIndex))
            .toList();
        for (QuantumOperation operation : sortedOperations) {
            code.append(operation.toCode(quantumCircuit)).append("\n");
        }
        return code.toString();
    }

    private static int minInvolvedQubitIndex(QuantumOperation operation) {
        int min = Integer.MAX_VALUE;
        for (ElementSelector selector : operation.getTargetQubits()) {
            min = Math.min(min, selector.getIndex());
        }
        if (operation.getControlQubits() != null) {
            for (ElementSelector selector : operation.getControlQubits()) {
                min = Math.min(min, selector.getIndex());
            }
        }
        return min;
    }
}
