package edu.kit.quak.application.user.ports.out;

import edu.kit.quak.core.user.model.User;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Output port for user persistence operations. */
public interface UserRepositoryPort {
    User save(User user);

    Optional<User> findById(UUID id);

    Optional<User> findByIssuerAndSub(String issuer, String sub);

    Optional<User> findByEmail(String email);

    /**
     * Searches for users whose email contains the given query string
     * (case-insensitive).
     *
     * @param email The email search query
     * @return A list of matching users
     */
    List<User> searchByEmail(String email);

    /**
     * Finds all guests that have not been active since the given instant.
     *
     * @param inactiveSince Guests whose last activity is before this instant are returned
     * @return The inactive guests
     */
    List<User> findInactiveGuests(Instant inactiveSince);

    /**
     * Sets the last activity of a user without loading it, so that concurrent calls do not conflict.
     *
     * @param issuer The OAuth2/OIDC issuer
     * @param sub The subject claim
     * @param lastActiveAt The time of the activity
     */
    void updateLastActiveAt(String issuer, String sub, Instant lastActiveAt);

    void deleteById(UUID id);

    /**
     * Finds all users with the given IDs.
     *
     * @param ids The list of user IDs to find
     * @return A list of found users
     */
    List<User> findAllByIds(List<UUID> ids);
}
