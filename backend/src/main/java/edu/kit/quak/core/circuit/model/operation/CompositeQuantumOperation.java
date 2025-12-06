package edu.kit.quak.core.circuit.model.operation;

import edu.kit.quak.core.circuit.model.Layer;

import java.util.ArrayList;
import java.util.List;

public class CompositeQuantumOperation extends QuantumOperation {
    private List<Layer> layers = new ArrayList<>();

    public List<Layer> getLayers() { return layers; }
}