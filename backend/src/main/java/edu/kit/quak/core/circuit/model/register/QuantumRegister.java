package edu.kit.quak.core.circuit.model.register;

import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGate;
import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGateDefinitionIdentifier;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

public class QuantumRegister extends Register {
    private List<Qubit> qubits = new ArrayList<>();

    public QuantumRegister(String name) {
        super(name);
    }

    @Override
    public Optional<QuantumRegister> asQuantum() {
        return Optional.of(this);
    }

    public List<Qubit> getQubits() {
        return Collections.unmodifiableList(qubits);
    }

    public void setQubits(List<Qubit> qubits) {
        this.qubits = qubits;
    }

    public Qubit addQubit() {
        Qubit qubit = new Qubit();
        qubits.add(qubit);
        return qubit;
    }

    public void addElementaryQuantumGate(ElementaryQuantumGateDefinitionIdentifier definitionId, int positionIdx) {
        Qubit qubit = qubits.getFirst();
        ElementaryQuantumGate gate = new ElementaryQuantumGate(definitionId);
        qubit.addOperation(positionIdx, gate);
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("QuantumRegister: ").append(getName());
        qubits.forEach(q -> sb.append("\n    ").append(q.toString().replace("\n", "\n    ")));
        return sb.toString();
    }
}
