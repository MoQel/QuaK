package edu.kit.quak.infrastructure.circuit.out.db.jpa.repository;

import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.JpaQuantumCircuit;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataJpaCircuitRepository extends JpaRepository<JpaQuantumCircuit, String> {
    /** The project-level circuit is the one without a linked file. */
    Optional<JpaQuantumCircuit> findByProjectIdAndFileIdIsNull(String projectId);

    Optional<JpaQuantumCircuit> findByFileId(String fileId);

    void deleteByFileId(String fileId);

    void deleteAllByProjectId(String projectId);
}
