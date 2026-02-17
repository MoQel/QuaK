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
}
