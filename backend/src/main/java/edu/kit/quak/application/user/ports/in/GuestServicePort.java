package edu.kit.quak.application.user.ports.in;

import edu.kit.quak.core.user.model.AuthenticatedUser;
import edu.kit.quak.core.user.model.User;
import java.time.Instant;
import java.util.UUID;

/** Input port for guest account operations. */
public interface GuestServicePort {
    /**
     * Creates and persists a new guest account.
     *
     * @param current The caller's current authentication, null if not authenticated
     * @return The created guest user
     * @throws edu.kit.quak.application.user.exceptions.AlreadyAuthenticatedException if the caller is already authenticated
     */
    User createGuest(AuthenticatedUser current);

    /**
     * Records that the guest with the given subject is still active.
     *
     * @param subject The guest's generated subject
     */
    void recordActivity(String subject);

    /**
     * Deletes the guest with the given subject together with its data, e.g. when its session ends.
     *
     * @param subject The guest's generated subject
     */
    void deleteGuest(String subject);

    /**
     * Moves all data of a guest to a real account and deletes the guest afterwards.
     *
     * @param subject   The guest's generated subject
     * @param accountId The ID of the account that receives the guest's data
     * @throws edu.kit.quak.application.user.exceptions.UserNotFoundException if no guest with the subject exists
     */
    void upgradeGuest(String subject, UUID accountId);

    /**
     * Deletes guest accounts that have not been active since the given instant, each in its own transaction.
     *
     * @param inactiveSince Guests whose last activity is before this instant are deleted
     * @return The number of deleted guests
     */
    int deleteInactiveGuests(Instant inactiveSince);
}
