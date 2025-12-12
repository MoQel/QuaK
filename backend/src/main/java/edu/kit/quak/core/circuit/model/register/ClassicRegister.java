package edu.kit.quak.core.circuit.model.register;

import java.util.ArrayList;
import java.util.List;

public class ClassicRegister extends Register {
    private final List<Boolean> bits;

    public ClassicRegister(String name) {
        super(name);
        bits = new ArrayList<>();
    }

    public List<Boolean> getBits() {
        return bits;
    }

    public void addBit(Boolean bit) {
        bits.add(bit);
    }
}