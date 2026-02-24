package edu.kit.quak.infrastructure.user.in.web.rest.dto;

import java.util.UUID;

/**
 * Response DTO for a project role assignment.
 *
 * @param userId    the UUID of the user
 * @param projectId the ID of the project
 * @param role      the role name (e.g., "OWNER", "VIEWER")
 */
public record ProjectRoleResponse(
        UUID userId,
        String projectId,
        String role,
        String email,
        String name,
        String avatarUrl) {
}
