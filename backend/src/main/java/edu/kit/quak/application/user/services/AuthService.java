package edu.kit.quak.application.user.services;

import edu.kit.quak.application.user.ports.in.AuthServicePort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for authentication-related business logic.
 * Handles auth status checks, user info retrieval, and logout operations.
 */
@Service("newAuthService")
public class AuthService implements AuthServicePort {

    @Override
    public Map<String, Object> getAuthenticationStatus() {
        Map<String, Object> response = new HashMap<>();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.isAuthenticated()
                && !"anonymousUser".equals(authentication.getPrincipal())) {

            response.put("authenticated", true);

            if (authentication.getPrincipal() instanceof OAuth2User user) {
                Map<String, Object> userInfo = new HashMap<>();
                userInfo.put("email", user.getAttribute("email"));
                userInfo.put("name", user.getAttribute("name"));
                userInfo.put("picture", user.getAttribute("picture"));
                response.put("user", userInfo);
            }
        } else {
            response.put("authenticated", false);
        }

        return response;
    }

    @Override
    public Map<String, Object> getAuthenticatedUserInfo() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.getPrincipal() instanceof OAuth2User user) {
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("email", user.getAttribute("email"));
            userInfo.put("name", user.getAttribute("name"));
            userInfo.put("picture", user.getAttribute("picture"));
            userInfo.put("sub", user.getAttribute("sub"));
            return userInfo;
        }

        throw new RuntimeException("User not authenticated");
    }

    @Override
    public Map<String, String> logout(String sessionId) {
        // Clear the security context
        // Note: Actual session invalidation is handled by the infrastructure adapter
        SecurityContextHolder.clearContext();

        Map<String, String> response = new HashMap<>();
        response.put("message", "Logged out successfully");
        return response;
    }
}
