package edu.kit.quak.infrastructure.circuit.out.db.jpa.repository;

import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.JpaQuantumCircuit;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataJpaCircuitRepository extends JpaRepository<JpaQuantumCircuit, String> {
    Optional<JpaQuantumCircuit> findByProjectId(String projectId);
}
