package edu.kit.quak.application.filesystem.service;

import jakarta.servlet.http.HttpSession;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for authentication-related business logic.
 * Handles auth status checks, user info retrieval, and logout operations.
 *
 * @author QuaK Team
 */
@Service
public class AuthService {

    /**
     * Retrieves the current authentication status and user information.
     *
     * @return Map containing authentication status and user information (if authenticated)
     */
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

    /**
     * Retrieves the currently authenticated user's information.
     *
     * @return Map containing user information
     * @throws RuntimeException if user is not authenticated
     */
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

    /**
     * Performs logout operation by invalidating the session and clearing the security context.
     *
     * @param session The HTTP session to invalidate
     * @return Map containing success message
     */
    public Map<String, String> logout(HttpSession session) {
        session.invalidate();
        SecurityContextHolder.clearContext();
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Logged out successfully");
        return response;
    }
}
