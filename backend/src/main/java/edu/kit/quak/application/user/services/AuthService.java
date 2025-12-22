package edu.kit.quak.application.user.services;

import edu.kit.quak.application.user.ports.in.AuthServicePort;
import edu.kit.quak.core.user.model.AuthenticatedUser;
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
public class AuthService implements AuthServicePort {

    @Override
    public Map<String, Object> getAuthenticationStatus(Optional<AuthenticatedUser> authenticatedUser,
            Optional<Map<String, Object>> userInfo) {
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
            throw new IllegalStateException("User not authenticated");
        }
        return new HashMap<>(userInfo);
    }

    @Override
    public Map<String, String> logout(String sessionId) {
        // Business logic for logout can be added here if needed
        // (e.g., audit logging, cleanup operations)

        Map<String, String> response = new HashMap<>();
        response.put("message", "Logged out successfully");
        return response;
    }
}
