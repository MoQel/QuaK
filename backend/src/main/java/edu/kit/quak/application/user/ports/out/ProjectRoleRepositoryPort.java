package edu.kit.quak.application.user.ports.out;

import edu.kit.quak.core.user.model.ProjectRole;
import edu.kit.quak.core.user.model.ProjectRoleAssignment;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Output port for project role persistence operations. */
public interface ProjectRoleRepositoryPort {

    /**
     * Saves a project role assignment.
     *
     * @param assignment the role assignment to save
     * @return the persisted role assignment
     */
    ProjectRoleAssignment save(ProjectRoleAssignment assignment);

    /**
     * Finds the role a user has for a specific project.
     *
     * @param userId    the user's UUID
     * @param projectId the project's ID
     * @return the role assignment if it exists
     */
    Optional<ProjectRoleAssignment> findByUserIdAndProjectId(UUID userId, String projectId);

    /**
     * Lists all role assignments for a given project.
     *
     * @param projectId the project's ID
     * @return all role assignments for the project
     */
    List<ProjectRoleAssignment> findAllByProjectId(String projectId);

    /**
     * Lists all role assignments for a given user.
     *
     * @param userId the user's UUID
     * @return all role assignments for the user
     */
    List<ProjectRoleAssignment> findAllByUserId(UUID userId);

    /**
     * Lists all projects that a user has a specific role on.
     *
     * @param userId the user's UUID
     * @param role   the role to filter by
     * @return all matching role assignments
     */
    List<ProjectRoleAssignment> findAllByUserIdAndRole(UUID userId, ProjectRole role);

    /**
     * Deletes a role assignment by user ID and project ID.
     *
     * @param userId    the user's UUID
     * @param projectId the project's ID
     */
    void deleteByUserIdAndProjectId(UUID userId, String projectId);

    /**
     * Deletes all role assignments for a given project.
     *
     * @param projectId the project's ID
     */
    void deleteAllByProjectId(String projectId);
}
