package edu.kit.quak.application.user.ports.in;

import edu.kit.quak.application.user.dto.AuthStatusResponse;
import edu.kit.quak.application.user.dto.LogoutResponse;
import edu.kit.quak.core.user.model.AuthenticatedUser;
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
     * @return AuthStatusResponse containing authentication status and user info if authenticated
     */
    AuthStatusResponse getAuthenticationStatus(Optional<AuthenticatedUser> authenticatedUser);

    /**
     * Handles logout operation.
     *
     * @param sessionId The session ID to logout
     * @return LogoutResponse containing logout status message
     */
    LogoutResponse logout(String sessionId);
}
