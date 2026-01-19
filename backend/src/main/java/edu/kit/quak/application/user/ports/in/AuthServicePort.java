package edu.kit.quak.application.user.ports.in;

import edu.kit.quak.core.user.model.AuthenticatedUser;
import java.util.Map;
import java.util.Optional;

/**
 * Input port for authentication operations. This port is framework-agnostic and uses only domain
 * concepts.
 */
public interface AuthServicePort {

    /**
     * Builds authentication status response from the provided authenticated user.
     *
     * @param authenticatedUser Optional authenticated user, empty if not authenticated
     * @param userInfo Optional user info map (email, name, picture) from the identity provider
     * @return Map containing authentication status and user info if authenticated
     */
    Map<String, Object> getAuthenticationStatus(
            Optional<AuthenticatedUser> authenticatedUser, Optional<Map<String, Object>> userInfo);

    /**
     * Builds user info response from the provided authenticated user.
     *
     * @param authenticatedUser The authenticated user
     * @param userInfo User info map (email, name, picture, sub) from the identity provider
     * @return Map containing user information
     * @throws IllegalStateException if user is not authenticated
     */
    Map<String, Object> getAuthenticatedUserInfo(
            AuthenticatedUser authenticatedUser, Map<String, Object> userInfo);

    /**
     * Handles logout operation.
     *
     * @param sessionId The session ID to logout
     * @return Map containing logout status message
     */
    Map<String, String> logout(String sessionId);
}
