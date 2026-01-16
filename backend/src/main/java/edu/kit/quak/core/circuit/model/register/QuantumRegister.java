package edu.kit.quak.core.circuit.model.register;

import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGateType;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class QuantumRegister extends Register {
    private List<Qubit> qubits = new ArrayList<>();

    public QuantumRegister(String name) {
        super(name);
    }

    @Override
    public List<Qubit> getQubits() {
        return Collections.unmodifiableList(qubits);
    }

    public void setQubits(List<Qubit> qubits) {
        this.qubits = qubits;
    }

    @Override
    public Qubit addQubit() {
        Qubit qubit = new Qubit();
        qubits.add(qubit);
        return qubit;
    }

    @Override
    public void addElementaryQuantumGate(ElementaryQuantumGateType type, int positionIdx) {
        Qubit qubit = qubits.getFirst();
        ElementaryQuantumGate gate = new ElementaryQuantumGate(type);
        qubit.addOperation(positionIdx, gate);
    }

    @Override
    public List<Boolean> getBits() {
        return List.of();
    }

    @Override
    public void addBit(Boolean bit) {
        throw new UnsupportedOperationException("Not a classic register");
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("QuantumRegister: ").append(getName());
        qubits.forEach(q -> sb.append("\n    ").append(q.toString().replace("\n", "\n    ")));
        return sb.toString();
    }
}
