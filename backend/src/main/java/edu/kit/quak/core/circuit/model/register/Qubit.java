package edu.kit.quak.core.circuit.model.register;

import edu.kit.quak.core.circuit.model.ElementWithId;
import edu.kit.quak.core.circuit.model.operation.QuantumOperation;

import java.util.ArrayList;
import java.util.List;

public class Qubit extends ElementWithId {
    private final List<QuantumOperation> operations;

    public Qubit() {
        super();
        operations = new ArrayList<>();
    }

    public void addOperation(QuantumOperation operation) {
        operations.add(operation);
    }

    public List<QuantumOperation> getOperations() {
        return operations;
    }
}