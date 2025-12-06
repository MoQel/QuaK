package edu.kit.quak.application.ports.out;

import edu.kit.quak.core.circuit.model.QuantumCircuit;

import java.util.Optional;

public interface CircuitRepositoryPort {
    Optional<QuantumCircuit> findCircuitById(String id);
    QuantumCircuit save(QuantumCircuit circuit);
}
