package edu.kit.quak.infrastructure.user.in.web.rest.dto;

import java.util.UUID;

/**
 * Infrastructure-specific DTO for authenticated user information in the REST response.
 *
 * @param userId The unique identifier of the user
 * @param email The user's email address
 * @param name The user's display name
 * @param picture The URL to the user's profile picture/avatar
 */
public record AuthUserResponse(UUID userId, String email, String name, String picture) {}
