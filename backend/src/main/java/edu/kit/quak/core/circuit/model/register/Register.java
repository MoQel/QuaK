package edu.kit.quak.core.circuit.model.register;

import edu.kit.quak.core.circuit.model.ElementWithId;
import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGateType;

import java.util.List;

public abstract class Register extends ElementWithId {
    protected String name;

    protected Register(String name) {
        super();
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public abstract List<Qubit> getQubits();

    public abstract Qubit addQubit();

    public abstract void addElementaryQuantumGate(ElementaryQuantumGateType type, int positionIdx);

    public abstract List<Boolean> getBits();

    public abstract void addBit(Boolean bit);
}
