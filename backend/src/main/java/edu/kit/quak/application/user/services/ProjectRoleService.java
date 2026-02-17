package edu.kit.quak.application.user.services;

import edu.kit.quak.application.filesystem.exceptions.AccessDeniedException;
import edu.kit.quak.application.user.ports.in.ProjectRoleServicePort;
import edu.kit.quak.application.user.ports.out.ProjectRoleRepositoryPort;
import edu.kit.quak.core.user.model.ProjectRole;
import edu.kit.quak.core.user.model.ProjectRoleAssignment;
import edu.kit.quak.core.user.model.User;
import java.util.List;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service implementing project role business logic. Handles role assignment,
 * removal, and
 * authorization checks.
 */
@Service
@Transactional
@Slf4j
public class ProjectRoleService implements ProjectRoleServicePort {

    private final ProjectRoleRepositoryPort roleRepository;

    public ProjectRoleService(ProjectRoleRepositoryPort roleRepository) {
        this.roleRepository = roleRepository;
    }

    @Override
    public ProjectRoleAssignment assignRole(
            String projectId, UUID targetUserId, ProjectRole role, User requestingUser) {
        log.info(
                "Assigning role '{}' to user '{}' for project '{}' (requested by '{}')",
                role,
                targetUserId,
                projectId,
                requestingUser.getId());

        verifyOwnerRole(projectId, requestingUser);

        // Prevent assigning OWNER role to another user (there should be exactly one
        // owner)
        if (role == ProjectRole.OWNER) {
            throw new IllegalArgumentException("Cannot assign OWNER role. Projects can only have one owner.");
        }

        // Check if user already has a role on this project
        roleRepository.findByUserIdAndProjectId(targetUserId, projectId).ifPresent(existing -> {
            throw new IllegalArgumentException("User already has role '" + existing.getRole() + "' on this project. "
                    + "Remove the existing role first.");
        });

        ProjectRoleAssignment assignment = new ProjectRoleAssignment(targetUserId, projectId, role);
        return roleRepository.save(assignment);
    }

    @Override
    public void removeRole(String projectId, UUID targetUserId, User requestingUser) {
        log.info(
                "Removing role for user '{}' from project '{}' (requested by '{}')",
                targetUserId,
                projectId,
                requestingUser.getId());

        verifyOwnerRole(projectId, requestingUser);

        // Cannot remove the owner's own role
        if (targetUserId.equals(requestingUser.getId())) {
            throw new IllegalArgumentException("Cannot remove your own OWNER role from the project.");
        }

        roleRepository.deleteByUserIdAndProjectId(targetUserId, projectId);
    }

    @Override
    public List<ProjectRoleAssignment> getRolesForProject(String projectId, User requestingUser) {
        log.debug("Listing roles for project '{}' (requested by '{}')", projectId, requestingUser.getId());
        verifyOwnerRole(projectId, requestingUser);
        return roleRepository.findAllByProjectId(projectId);
    }

    @Override
    public ProjectRole getUserRoleForProject(String projectId, UUID userId) {
        return roleRepository
                .findByUserIdAndProjectId(userId, projectId)
                .map(ProjectRoleAssignment::getRole)
                .orElse(null);
    }

    @Override
    public boolean hasMinimumRole(String projectId, UUID userId, ProjectRole minimumRole) {
        ProjectRole userRole = getUserRoleForProject(projectId, userId);
        if (userRole == null) {
            return false;
        }
        // OWNER has higher access than VIEWER
        if (minimumRole == ProjectRole.VIEWER) {
            return true; // Any role (OWNER or VIEWER) satisfies VIEWER requirement
        }
        // minimumRole == OWNER
        return userRole == ProjectRole.OWNER;
    }

    /**
     * Verifies that the requesting user is the OWNER of the project.
     *
     * @param projectId      the project ID
     * @param requestingUser the user to verify
     * @throws AccessDeniedException if the user is not an owner
     */
    private void verifyOwnerRole(String projectId, User requestingUser) {
        if (!hasMinimumRole(projectId, requestingUser.getId(), ProjectRole.OWNER)) {
            log.warn("Access denied: User '{}' is not OWNER of project '{}'", requestingUser.getId(), projectId);
            throw new AccessDeniedException("project", projectId);
        }
    }
}
