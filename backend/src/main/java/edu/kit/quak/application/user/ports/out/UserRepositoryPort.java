package edu.kit.quak.application.user.ports.out;

import edu.kit.quak.core.user.model.User;

import java.util.Optional;
import java.util.UUID;

/**
 * Output port for user persistence operations.
 */
public interface UserRepositoryPort {
    User save(User user);
    Optional<User> findById(UUID id);
    Optional<User> findByIssuerAndSub(String issuer, String sub);
    void deleteById(UUID id);
}
