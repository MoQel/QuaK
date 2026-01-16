package edu.kit.quak.core.circuit.model.register;

import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGateType;

import java.util.ArrayList;
import java.util.List;

public class ClassicRegister extends Register {
    private List<Boolean> bits = new ArrayList<>();

    public ClassicRegister(String name) {
        super(name);
    }

    @Override
    public List<Boolean> getBits() {
        return bits;
    }

    public void setBits(List<Boolean> bits) {
        this.bits = bits;
    }

    @Override
    public void addBit(Boolean bit) {
        bits.add(bit);
    }

    @Override
    public List<Qubit> getQubits() {
        return List.of();
    }

    @Override
    public Qubit addQubit() {
        throw new UnsupportedOperationException("Not a quantum register");
    }

    @Override
    public void addElementaryQuantumGate(ElementaryQuantumGateType type, int positionIdx) {
        throw new UnsupportedOperationException("Not a quantum register");
    }
}