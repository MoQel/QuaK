package edu.kit.quak.application.circuit.antlr.elements;

public class Qubit {

    private final String name;
    private final int index;

    public Qubit(String name, int index) {
        this.name = name;
        this.index = index;
    }

    public String getName() {
        return name;
    }

    public int getIndex() {
        return index;
    }

    @Override
    public String toString() {
        return name + "[" + index + "]";
    }
}
