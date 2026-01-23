package edu.kit.quak.infrastructure.user.in.web.rest.dto;

import java.util.UUID;

/**
 * Infrastructure-specific DTO for the authentication status REST response.
 *
 * @param authenticated Whether the user is authenticated
 * @param userId Unique identifier of the authenticated user, or null if not authenticated
 */
public record RestAuthStatusResponse(boolean authenticated, UUID userId) {}
