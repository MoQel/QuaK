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
     * Searches for users whose email matches the given query.
     *
     * @param emailQuery The email search query
     * @return A list of matching users
     */
    List<User> searchByEmail(String emailQuery);

    /**
     * Efficiently retrieves only the authenticated user's UUID without loading the
     * full entity. Use
     * this when only the user ID is needed (e.g., for ownership verification).
     *
     * @param authenticatedUser The authenticated user's claims
     * @return The user's UUID
     * @throws UserNotFoundException if user doesn't exist
     */
    UUID getAuthenticatedUserId(AuthenticatedUser authenticatedUser);

    /**
     * Finds all users with the given IDs.
     *
     * @param ids The list of user IDs to find
     * @return A list of found users
     */
    List<User> findAllByIds(List<UUID> ids);
}
