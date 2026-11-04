package edu.kit.quak.application.user.ports.in;

import edu.kit.quak.core.user.model.AuthenticatedUser;
import edu.kit.quak.core.user.model.User;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Input port defining user-related use cases. Uses only domain concepts, no
 * framework dependencies.
 */
public interface UserServicePort {
    User getAuthenticatedUser(AuthenticatedUser authenticatedUser);

    Optional<User> findById(UUID id);

    Optional<User> findByIssuerAndSub(String issuer, String sub);

    /**
     * Searches for users whose email matches the given query. Guests are anonymous, so they only
     * find a user by the exact email and cannot list registered users by a part of it.
     *
     * @param emailQuery The email search query
     * @param searcher The user who searches
     * @return A list of matching users
     */
    List<User> searchByEmail(String emailQuery, User searcher);

    /**
     * Finds all users with the given IDs.
     *
     * @param ids The list of user IDs to find
     * @return A list of found users
     */
    List<User> findAllByIds(List<UUID> ids);

    /**
     * Deletes the user together with their role assignments and publishes a
     * {@link edu.kit.quak.core.user.event.UserDeletedEvent} so that other contexts remove their data.
     *
     * @param id The ID of the user to delete
     */
    void deleteUser(UUID id);
}
