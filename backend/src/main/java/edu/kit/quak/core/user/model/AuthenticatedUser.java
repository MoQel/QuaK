package edu.kit.quak.core.user.model;

import java.util.UUID;

/**
 * Domain model representing an authenticated user in the system. This is a framework-agnostic
 * representation used throughout the application layer.
 *
 * @param userId The unique identifier of the authenticated user
 * @param issuer The OAuth2/OIDC issuer (e.g., "github", "google")
 * @param subject The subject claim from the OIDC token (unique per issuer)
 */
public record AuthenticatedUser(UUID userId, String issuer, String subject) {
    /** Creates an AuthenticatedUser from a User domain model. */
    public static AuthenticatedUser from(User user) {
        return new AuthenticatedUser(user.getId(), user.getIssuer(), user.getSub());
    }
}
