package edu.kit.quak.infrastructure.user.in.web.rest.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for assigning a role to a user on a project.
 *
 * @param userId the UUID of the user to assign the role to (as string)
 * @param role   the role to assign (e.g., "VIEWER")
 */
public record ProjectRoleRequest(
    @NotBlank(message = "User ID must not be blank") String userId,
    @NotBlank(message = "Role must not be blank") String role
) {}
