package edu.kit.quak.infrastructure.filesystem.out.db.jpa.repository;

import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaFileElementContainer;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SpringDataFileElementContainerRepository extends JpaRepository<JpaFileElementContainer<?>, String> {

    /**
     * Finds the owner ID of the root project containing the given element. Uses a
     * recursive CTE to
     * traverse the parent hierarchy in a single query, avoiding the N+1 query
     * problem.
     *
     * @param elementId The ID of any file element (file, directory, or project)
     * @return The UUID of the user who owns the root project
     */
    @Query(value = """
            WITH RECURSIVE hierarchy(id, parent_id, owner_id, dtype) AS (
                SELECT id, parent_id, owner_id, dtype
                FROM file_element
                WHERE id = :elementId
                UNION ALL
                SELECT fe.id, fe.parent_id, fe.owner_id, fe.dtype
                FROM file_element fe
                INNER JOIN hierarchy h ON fe.id = h.parent_id
            )
            SELECT owner_id FROM hierarchy WHERE dtype = 'project'
            """, nativeQuery = true)
    Optional<Object> findProjectOwnerIdByElementId(@Param("elementId") String elementId);

    /**
     * Finds the ID of the root project containing the given element. Uses the same
     * recursive CTE
     * approach as {@link #findProjectOwnerIdByElementId} but returns the project's
     * ID.
     *
     * @param elementId The ID of any file element (file, directory, or project)
     * @return The project ID
     */
    @Query(value = """
            WITH RECURSIVE hierarchy(id, parent_id, dtype) AS (
                SELECT id, parent_id, dtype
                FROM file_element
                WHERE id = :elementId
                UNION ALL
                SELECT fe.id, fe.parent_id, fe.dtype
                FROM file_element fe
                INNER JOIN hierarchy h ON fe.id = h.parent_id
            )
            SELECT id FROM hierarchy WHERE dtype = 'project'
            """, nativeQuery = true)
    Optional<String> findProjectIdByElementId(@Param("elementId") String elementId);
}
