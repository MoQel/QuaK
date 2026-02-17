package edu.kit.quak.infrastructure.user.out.db.jpa.repository;

import edu.kit.quak.core.user.model.ProjectRole;
import edu.kit.quak.infrastructure.user.out.db.jpa.entity.JpaProjectRoleAssignment;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/** Spring Data JPA repository for JpaProjectRoleAssignment entity. */
@Repository
public interface SpringDataProjectRoleRepository extends JpaRepository<JpaProjectRoleAssignment, Long> {

    Optional<JpaProjectRoleAssignment> findByUserIdAndProjectId(UUID userId, String projectId);

    List<JpaProjectRoleAssignment> findAllByProjectId(String projectId);

    List<JpaProjectRoleAssignment> findAllByUserId(UUID userId);

    List<JpaProjectRoleAssignment> findAllByUserIdAndRole(UUID userId, ProjectRole role);

    void deleteByUserIdAndProjectId(UUID userId, String projectId);

    void deleteAllByProjectId(String projectId);
}
