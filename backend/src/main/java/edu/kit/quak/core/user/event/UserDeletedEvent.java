package edu.kit.quak.core.user.event;

import java.util.UUID;

/**
 * Published when a user has been deleted, so that other contexts can remove the data they keep for that user.
 *
 * @param userId The ID of the deleted user
 */
public record UserDeletedEvent(UUID userId) {}
