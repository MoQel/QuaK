package edu.kit.quak.application.circuit.ports.out;

import edu.kit.quak.core.circuit.model.QuantumCircuit;
import java.util.Optional;

public interface CircuitRepositoryPort {
    Optional<QuantumCircuit> findById(String id);

    Optional<QuantumCircuit> findByProjectId(String projectId);

    QuantumCircuit save(QuantumCircuit circuit);

    void delete(String circuitId);
}
