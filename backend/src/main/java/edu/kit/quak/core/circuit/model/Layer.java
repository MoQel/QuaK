package edu.kit.quak.core.circuit.model;

import edu.kit.quak.core.circuit.model.operation.QuantumOperation;

import java.util.ArrayList;
import java.util.List;

public class Layer {
    private List<QuantumOperation> operations = new ArrayList<>();

    public List<QuantumOperation> getOperations() { return operations; }
}