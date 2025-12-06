package edu.kit.quak.core.circuit.model.operation;

public abstract class QuantumOperation {
    private boolean inverseForm;

    public boolean isInverseForm() { return inverseForm; }
    public void setInverseForm(boolean inverseForm) { this.inverseForm = inverseForm; }
}