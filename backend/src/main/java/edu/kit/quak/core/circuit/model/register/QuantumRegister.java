package edu.kit.quak.core.circuit.model.register;

public class QuantumRegister extends Register {
    private int numberOfQubits;

    public int getNumberOfQubits() { return numberOfQubits; }
    public void setNumberOfQubits(int numberOfQubits) { this.numberOfQubits = numberOfQubits; }
}
