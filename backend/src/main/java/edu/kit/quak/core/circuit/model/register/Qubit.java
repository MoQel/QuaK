package edu.kit.quak.core.circuit.model.register;

import edu.kit.quak.core.circuit.model.ElementWithId;
import edu.kit.quak.core.circuit.model.operation.QuantumOperation;

import java.util.ArrayList;
import java.util.List;

public class Qubit extends ElementWithId {
    private final List<QuantumOperation> operations = new ArrayList<>();

    public Qubit() {
        super();
    }

    public void addOperation(QuantumOperation operation) {
        operations.add(operation);
    }

    public List<QuantumOperation> getOperations() {
        return operations;
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