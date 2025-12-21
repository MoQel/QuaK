package edu.kit.quak.test.helpers;

import edu.kit.quak.core.user.model.AuthenticatedUser;

import java.util.UUID;

/**
 * Test helper for creating AuthenticatedUser instances in tests.
 */
public class AuthTestHelper {

    public static final String DEFAULT_ISSUER = "test";
    public static final String DEFAULT_SUBJECT = "test-sub";
    public static final UUID DEFAULT_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    /**
     * Creates a default AuthenticatedUser for testing.
     */
    public static AuthenticatedUser createAuthenticatedUser() {
        return new AuthenticatedUser(DEFAULT_USER_ID, DEFAULT_ISSUER, DEFAULT_SUBJECT);
    }

    /**
     * Creates an AuthenticatedUser with custom values.
     */
    public static AuthenticatedUser createAuthenticatedUser(UUID userId, String issuer, String subject) {
        return new AuthenticatedUser(userId, issuer, subject);
    }

    /**
     * Creates an AuthenticatedUser with custom userId but default issuer and
     * subject.
     */
    public static AuthenticatedUser createAuthenticatedUser(UUID userId) {
        return new AuthenticatedUser(userId, DEFAULT_ISSUER, DEFAULT_SUBJECT);
    }
}
