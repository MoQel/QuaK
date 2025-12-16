package edu.kit.quak.application.ports.in;

import edu.kit.quak.core.circuit.model.QuantumCircuit;

public interface CircuitServicePort {
    QuantumCircuit initCircuit();
    QuantumCircuit getCircuit(String id);
    QuantumCircuit addQubit(String id);
}
