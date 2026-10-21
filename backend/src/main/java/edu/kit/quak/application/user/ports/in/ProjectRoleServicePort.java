package edu.kit.quak.application.user.ports.in;

import edu.kit.quak.core.user.model.ProjectRole;
import edu.kit.quak.core.user.model.ProjectRoleAssignment;
import edu.kit.quak.core.user.model.User;
import java.util.List;
import java.util.UUID;

/**
 * Input port for project role-related use cases. Uses only domain concepts, no
 * framework
 * dependencies.
 */
public interface ProjectRoleServicePort {
    /**
     * Assigns a role to a user for a specific project. Only owners can assign
     * roles.
     *
     * @param projectId      the project ID
     * @param targetUserId   the UUID of the user to receive the role
     * @param role           the role to assign
     * @param requestingUser the user making the request (must be owner)
     * @return the created role assignment
     */
    ProjectRoleAssignment assignRole(String projectId, UUID targetUserId, ProjectRole role, User requestingUser);

    /**
     * Removes a user's role from a project. Only owners can remove roles.
     *
     * @param projectId      the project ID
     * @param targetUserId   the UUID of the user whose role should be removed
     * @param requestingUser the user making the request (must be owner)
     */
    void removeRole(String projectId, UUID targetUserId, User requestingUser);

    /**
     * Lists all role assignments for a project. Only owners can view all roles.
     *
     * @param projectId      the project ID
     * @param requestingUser the user making the request (must be owner)
     * @return all role assignments for the project
     */
    List<ProjectRoleAssignment> getRolesForProject(String projectId, User requestingUser);

    /**
     * Gets the role a specific user has for a project.
     *
     * @param projectId the project ID
     * @param userId    the user's UUID
     * @return the user's role, or null if they have no role
     */
    ProjectRole getUserRoleForProject(String projectId, UUID userId);

    /**
     * Checks whether a user has at least the given role (or higher) on a project.
     * OWNER is considered higher than VIEWER.
     *
     * @param projectId   the project ID
     * @param userId      the user's UUID
     * @param minimumRole the minimum required role
     * @return true if the user has the minimum role or higher
     */
    boolean hasMinimumRole(String projectId, UUID userId, ProjectRole minimumRole);

    /**
     * Moves all role assignments of one user to another, without an access check. Where the receiving user already
     * has a role on the same project, the higher of both roles is kept.
     *
     * @param fromUserId the user whose assignments are moved
     * @param toUserId   the user who receives them
     */
    void transferAllByUserId(UUID fromUserId, UUID toUserId);

    /**
     * Makes a user the owner of a newly created project, without an access check.
     *
     * @param projectId the project's ID
     * @param ownerId   the creator's UUID
     */
    void assignOwner(String projectId, UUID ownerId);

    /**
     * Lists the IDs of all projects on which a user has exactly the given role.
     *
     * @param userId the user's UUID
     * @param role   the role to filter by
     * @return the matching project IDs
     */
    List<String> findProjectIdsByUserIdAndRole(UUID userId, ProjectRole role);

    /**
     * Deletes all role assignments of a project, without an access check.
     *
     * @param projectId the project's ID
     */
    void deleteAllByProjectId(String projectId);
}
