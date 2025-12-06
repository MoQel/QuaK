package edu.kit.quak.core.circuit.model;

import edu.kit.quak.core.circuit.model.register.Register;

import java.util.ArrayList;
import java.util.List;

public class QuantumCircuit extends NamedElement {

    private List<Register> registers = new ArrayList<>();
    private List<Layer> layers = new ArrayList<>();

    public List<Register> getRegisters() { return registers; }
    public List<Layer> getLayers() { return layers; }
}
