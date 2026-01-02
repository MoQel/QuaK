package edu.kit.quak.application.ports.in;

import edu.kit.quak.core.circuit.model.QuantumCircuit;

public interface CircuitServicePort {
    QuantumCircuit init();
    QuantumCircuit get(String circuitId);
    void delete(String circuitId);

    QuantumCircuit addQubit(String circuitId);
    QuantumCircuit deleteQubit(String circuitId, String qubitId);
}
