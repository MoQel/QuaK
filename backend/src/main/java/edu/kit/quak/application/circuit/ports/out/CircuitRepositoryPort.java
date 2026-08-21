package edu.kit.quak.application.circuit.ports.out;

import edu.kit.quak.core.circuit.model.QuantumCircuit;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CircuitRepositoryPort {
    Optional<QuantumCircuit> findById(String id);

    Optional<QuantumCircuit> findByFileId(String fileId);

    /** Returns which of the given operation ids are already persisted (in any circuit). */
    List<String> findExistingOperationIds(Collection<String> operationIds);

    QuantumCircuit save(QuantumCircuit circuit);

    void delete(String circuitId);

    void deleteByFileId(String fileId);

    void deleteAllByProjectId(String projectId);
}
