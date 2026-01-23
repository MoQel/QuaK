package edu.kit.quak.infrastructure.filesystem.out.db.jpa.repository;

import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaProject;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataProjectRepository extends JpaRepository<JpaProject, String> {

    /**
     * Find all projects owned by a specific user.
     *
     * @param ownerId The UUID of the owner
     * @return List of projects owned by the user
     */
    List<JpaProject> findAllByOwnerId(UUID ownerId);
}
