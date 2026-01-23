package edu.kit.quak.application.user.dto;

import edu.kit.quak.core.user.model.User;

/**
 * DTO for authentication status response.
 *
 * @param authenticated Whether the user is authenticated
 * @param user User information if authenticated, null otherwise
 */
public record AuthStatusResponse(boolean authenticated, User user) {}
