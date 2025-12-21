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
}
