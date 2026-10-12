package edu.kit.quak.infrastructure.user.in.web.rest.dto;

import java.util.UUID;

/**
 * Infrastructure-specific DTO for the authentication status REST response.
 *
 * @param authenticated Whether the user is authenticated
 * @param userId Unique identifier of the authenticated user, or null if not authenticated
 * @param guest Whether the authenticated user is a guest account
 */
public record RestAuthStatusResponse(boolean authenticated, UUID userId, boolean guest) {}
