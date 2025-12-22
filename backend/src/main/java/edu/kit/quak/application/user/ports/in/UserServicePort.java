package edu.kit.quak.application.user.ports.in;

import edu.kit.quak.core.user.model.AuthenticatedUser;
import edu.kit.quak.core.user.model.User;

import java.util.Optional;
import java.util.UUID;

/**
 * Input port defining user-related use cases.
 * Uses only domain concepts, no framework dependencies.
 */
public interface UserServicePort {
    User getAuthenticatedUser(AuthenticatedUser authenticatedUser);

    Optional<User> findById(UUID id);

    Optional<User> findByIssuerAndSub(String issuer, String sub);

    /**
     * Efficiently retrieves only the authenticated user's UUID without loading the
     * full entity.
     * Use this when only the user ID is needed (e.g., for ownership verification).
     * 
     * @param authenticatedUser The authenticated user's claims
     * @return The user's UUID
     * @throws UserNotFoundException if user doesn't exist
     */
    UUID getAuthenticatedUserId(AuthenticatedUser authenticatedUser);
}
