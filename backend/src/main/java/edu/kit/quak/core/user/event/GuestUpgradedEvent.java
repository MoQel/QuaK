package edu.kit.quak.core.user.event;

import java.util.UUID;

/**
 * Published when a guest signs in with a real account, so that other contexts move the guest's data to that account.
 *
 * @param guestId   The ID of the guest whose data is moved
 * @param accountId The ID of the account that receives the data
 */
public record GuestUpgradedEvent(UUID guestId, UUID accountId) {}
