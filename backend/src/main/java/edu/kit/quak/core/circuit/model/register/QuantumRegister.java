package edu.kit.quak.core.circuit.model.register;

import java.util.ArrayList;
import java.util.List;

public class QuantumRegister extends Register {
    private final List<Qubit> qubits;

    public QuantumRegister(String name) {
        super(name);
        qubits = new ArrayList<>();
    }

    public List<Qubit> getQubits() {
        return qubits;
    }

    public void addQubit() {
        qubits.add(new Qubit());
    }
}
