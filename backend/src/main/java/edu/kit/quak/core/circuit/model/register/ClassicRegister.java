package edu.kit.quak.core.circuit.model.register;

import java.util.ArrayList;
import java.util.List;

public class ClassicRegister extends Register {
    private final List<Boolean> bits = new ArrayList<>();

    public ClassicRegister(String name) {
        super(name);
    }

    public List<Boolean> getBits() {
        return bits;
    }

    public void addBit(Boolean bit) {
        bits.add(bit);
    }
}