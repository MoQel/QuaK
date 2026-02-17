package edu.kit.quak.application.user.ports.out;

import edu.kit.quak.core.user.model.User;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Output port for user persistence operations. */
public interface UserRepositoryPort {
    User save(User user);

    Optional<User> findById(UUID id);

    Optional<User> findByIssuerAndSub(String issuer, String sub);

    /**
     * Efficiently retrieves only the user's UUID without loading the full entity.
     * Use this when
     * only the user ID is needed (e.g., for ownership verification).
     *
     * @param issuer The OAuth2/OIDC issuer
     * @param sub    The subject claim from the OIDC token
     * @return The user's UUID if found
     */
    Optional<UUID> findIdByIssuerAndSub(String issuer, String sub);

    /**
     * Searches for users whose email contains the given query string
     * (case-insensitive).
     *
     * @param email The email search query
     * @return A list of matching users
     */
    List<User> searchByEmail(String email);

    void deleteById(UUID id);
}
