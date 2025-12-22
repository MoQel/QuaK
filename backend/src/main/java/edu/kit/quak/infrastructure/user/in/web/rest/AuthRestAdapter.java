package edu.kit.quak.infrastructure.user.in.web.rest;

import edu.kit.quak.application.user.ports.in.AuthServicePort;
import edu.kit.quak.core.user.model.AuthenticatedUser;
import edu.kit.quak.infrastructure.user.in.web.rest.mapper.AuthenticationMapper;
import jakarta.servlet.http.HttpSession;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * REST adapter for authentication-related endpoints.
 * Handles HTTP-specific concerns and delegates business logic to the
 * application layer.
 * 
 * This adapter is responsible for:
 * - Extracting authentication from Spring Security context
 * - Converting framework-specific objects to domain models
 * - Handling session management
 */
@RestController
@RequestMapping("/api/auth")
public class AuthRestAdapter {

    private final AuthServicePort authService;
    private final AuthenticationMapper authenticationMapper;

    public AuthRestAdapter(AuthServicePort authService,
            AuthenticationMapper authenticationMapper) {
        this.authService = authService;
        this.authenticationMapper = authenticationMapper;
    }

    @GetMapping("/status")
    public Map<String, Object> getAuthStatus(HttpSession session) {
        Optional<AuthenticatedUser> authenticatedUser = extractAuthenticatedUser();
        Optional<Map<String, Object>> userInfo = extractUserInfo();

        return authService.getAuthenticationStatus(authenticatedUser, userInfo);
    }

    @GetMapping("/user")
    public Map<String, Object> getUser() {
        AuthenticatedUser authenticatedUser = extractAuthenticatedUser()
                .orElseThrow(() -> new IllegalStateException("User not authenticated"));
        Map<String, Object> userInfo = extractUserInfoWithSub()
                .orElseThrow(() -> new IllegalStateException("User info not available"));

        return authService.getAuthenticatedUserInfo(authenticatedUser, userInfo);
    }

    @PostMapping("/logout")
    public Map<String, String> logout(HttpSession session) {
        // Extract sessionId for business logic
        String sessionId = session.getId();

        // Call application service
        Map<String, String> response = authService.logout(sessionId);

        // Handle infrastructure concerns: clear security context and invalidate session
        SecurityContextHolder.clearContext();
        session.invalidate();

        return response;
    }

    /**
     * Extracts AuthenticatedUser from Spring Security context.
     * 
     * @return Optional containing the authenticated user, empty if not
     *         authenticated
     */
    private Optional<AuthenticatedUser> extractAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return Optional.empty();
        }

        try {
            return Optional.of(authenticationMapper.toDomain(authentication));
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    /**
     * Extracts user info (email, name, picture) from OAuth2User principal.
     * 
     * @return Optional containing user info map, empty if not available
     */
    private Optional<Map<String, Object>> extractUserInfo() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.getPrincipal() instanceof OAuth2User user) {
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("email", user.getAttribute("email"));
            userInfo.put("name", user.getAttribute("name"));
            userInfo.put("picture", user.getAttribute("picture"));
            return Optional.of(userInfo);
        }

        return Optional.empty();
    }

    /**
     * Extracts user info including 'sub' claim from OAuth2User principal.
     * 
     * @return Optional containing user info map with sub, empty if not available
     */
    private Optional<Map<String, Object>> extractUserInfoWithSub() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.getPrincipal() instanceof OAuth2User user) {
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("email", user.getAttribute("email"));
            userInfo.put("name", user.getAttribute("name"));
            userInfo.put("picture", user.getAttribute("picture"));
            userInfo.put("sub", user.getAttribute("sub"));
            return Optional.of(userInfo);
        }

        return Optional.empty();
    }
}
