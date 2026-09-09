package edu.kit.quak.infrastructure.circuit.out.db.jpa.repository;

import edu.kit.quak.infrastructure.circuit.out.db.jpa.entity.layer.operation.JpaQuantumOperation;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SpringDataJpaQuantumOperationRepository extends JpaRepository<JpaQuantumOperation, String> {
    /** Returns which of the given operation ids are already persisted (in any circuit). */
    @Query("select o.id from JpaQuantumOperation o where o.id in :ids")
    List<String> findExistingIds(@Param("ids") Collection<String> ids);
}
