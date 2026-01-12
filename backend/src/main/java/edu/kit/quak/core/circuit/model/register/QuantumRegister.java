package edu.kit.quak.core.circuit.model.register;

import java.util.ArrayList;
import java.util.List;

public class QuantumRegister extends Register {
    private final List<Qubit> qubits = new ArrayList<>();

    public QuantumRegister(String name) {
        super(name);
    }

    public List<Qubit> getQubits() {
        return qubits;
    }

    public Qubit addQubit() {
        Qubit qubit = new Qubit();
        qubits.add(qubit);
        return qubit;
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("QuantumRegister: ").append(getName());
        qubits.forEach(q -> sb.append("\n    ").append(q.toString().replace("\n", "\n    ")));
        return sb.toString();
    }
}
