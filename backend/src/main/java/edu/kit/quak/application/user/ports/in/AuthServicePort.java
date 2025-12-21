package edu.kit.quak.application.user.ports.in;

import java.util.Map;

/**
 * Input port for authentication operations.
 * This port is framework-agnostic and uses only domain concepts.
 */
public interface AuthServicePort {
    Map<String, Object> getAuthenticationStatus();

    Map<String, Object> getAuthenticatedUserInfo();

    Map<String, String> logout(String sessionId);
}
