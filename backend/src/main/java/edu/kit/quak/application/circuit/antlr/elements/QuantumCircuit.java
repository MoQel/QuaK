package edu.kit.quak.application.circuit.antlr.elements;

import java.util.ArrayList;
import java.util.List;

public class QuantumCircuit {

    private final List<Qubit> qubits = new ArrayList<>();
    private final List<Operation> operations = new ArrayList<>();

    public void addQubit(Qubit q) {
        qubits.add(q);
    }

    public List<Qubit> getQubits() {
        return qubits;
    }

    public void addOperation(Operation op) {
        operations.add(op);
    }

    public List<Operation> getOperations() {
        return operations;
    }

    @Override
    public String toString() {
        return "QuantumCircuit{" + "qubits=" + qubits + ", operations=" + operations + '}';
    }
}
