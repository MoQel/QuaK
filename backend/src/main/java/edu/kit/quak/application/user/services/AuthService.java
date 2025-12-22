package edu.kit.quak.application.user.services;

import edu.kit.quak.application.user.ports.in.AuthServicePort;
import edu.kit.quak.core.user.model.AuthenticatedUser;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Service for authentication-related business logic.
 * Handles auth status checks, user info retrieval, and logout operations.
 * 
 * This service is framework-agnostic and works only with domain concepts.
 * The infrastructure layer (AuthRestAdapter) is responsible for extracting
 * authentication information from the framework and passing it here.
 */
@Service
@Slf4j
public class AuthService implements AuthServicePort {

    @Override
    public Map<String, Object> getAuthenticationStatus(Optional<AuthenticatedUser> authenticatedUser,
            Optional<Map<String, Object>> userInfo) {
        log.debug("Checking auth status. Authenticated: {}", authenticatedUser.isPresent());
        Map<String, Object> response = new HashMap<>();

        if (authenticatedUser.isPresent()) {
            response.put("authenticated", true);
            userInfo.ifPresent(info -> response.put("user", info));
        } else {
            response.put("authenticated", false);
        }

        return response;
    }

    @Override
    public Map<String, Object> getAuthenticatedUserInfo(AuthenticatedUser authenticatedUser,
            Map<String, Object> userInfo) {
        if (authenticatedUser == null) {
            log.warn("Attempt to access user info without authentication");
            throw new IllegalStateException("User not authenticated");
        }
        log.debug("Retrieving user info for user: issuer={} sub={}", authenticatedUser.issuer(),
                authenticatedUser.subject());
        return new HashMap<>(userInfo);
    }

    @Override
    public Map<String, String> logout(String sessionId) {
        log.info("Processing logout for session: {}", sessionId);
        // Business logic for logout can be added here if needed
        // (e.g., audit logging, cleanup operations)

        Map<String, String> response = new HashMap<>();
        response.put("message", "Logged out successfully");
        return response;
    }
}
