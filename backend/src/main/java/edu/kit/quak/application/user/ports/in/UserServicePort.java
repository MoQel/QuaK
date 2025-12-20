package edu.kit.quak.application.user.ports.in;

import edu.kit.quak.core.user.model.User;
import org.springframework.security.core.Authentication;

import java.util.Optional;
import java.util.UUID;

/**
 * Input port defining user-related use cases.
 */
public interface UserServicePort {
    User getAuthenticatedUser(Authentication authentication);
    Optional<User> findById(UUID id);
    Optional<User> findByIssuerAndSub(String issuer, String sub);
}
