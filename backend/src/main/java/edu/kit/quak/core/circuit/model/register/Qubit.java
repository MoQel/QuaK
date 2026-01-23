package edu.kit.quak.core.circuit.model.register;

import edu.kit.quak.core.circuit.model.ElementWithId;
import edu.kit.quak.core.circuit.model.operation.QuantumOperation;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Qubit extends ElementWithId {
    private List<QuantumOperation> operations = new ArrayList<>();

    public Qubit() {
        super();
    }

    public List<QuantumOperation> getOperations() {
        return Collections.unmodifiableList(operations);
    }

    public void setOperations(List<QuantumOperation> operations) {
        this.operations = operations;
    }

    public void addOperation(int index, QuantumOperation operation) {
        operations.add(index, operation);
    }

    public void removeOperation(QuantumOperation operation) {
        operations.remove(operation);
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("Qubit [");
        if (operations.isEmpty()) {
            sb.append("no operations]");
        } else {
            sb.append("\n      ");
            for (int i = 0; i < operations.size(); i++) {
                sb.append(i).append(": ").append(operations.get(i));
                if (i < operations.size() - 1) sb.append("\n      ");
            }
            sb.append("\n    ]");
        }
        return sb.toString();
    }
}
