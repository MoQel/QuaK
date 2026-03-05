package edu.kit.quak.infrastructure.user.in.web.rest;

import edu.kit.quak.application.user.dto.AuthStatusResponse;
import edu.kit.quak.application.user.dto.LogoutResponse;
import edu.kit.quak.application.user.exceptions.UserNotFoundException;
import edu.kit.quak.application.user.ports.in.AuthServicePort;
import edu.kit.quak.core.user.model.AuthenticatedUser;
import edu.kit.quak.infrastructure.user.in.web.rest.dto.RestAuthStatusResponse;
import edu.kit.quak.infrastructure.user.in.web.rest.dto.RestLogoutResponse;
import edu.kit.quak.infrastructure.user.in.web.rest.mapper.AuthenticationMapper;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpSession;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST adapter for authentication-related endpoints. Handles HTTP-specific
 * concerns and delegates
 * business logic to the application layer.
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Authentication and user session management endpoints")
public class AuthRestAdapter {

    private final AuthServicePort authService;
    private final AuthenticationMapper authenticationMapper;

    public AuthRestAdapter(AuthServicePort authService, AuthenticationMapper authenticationMapper) {
        this.authService = authService;
        this.authenticationMapper = authenticationMapper;
    }

    @GetMapping("/user")
    public RestAuthStatusResponse getUser() {
        Optional<AuthenticatedUser> authenticatedUser = extractAuthenticatedUser();

        AuthStatusResponse response = authService.getAuthenticationStatus(authenticatedUser);
        return authenticationMapper.toRestResponse(response);
    }

    @PostMapping("/logout")
    public RestLogoutResponse logout(HttpSession session) {
        // Extract sessionId for business logic
        String sessionId = session.getId();

        // Call application service
        LogoutResponse response = authService.logout(sessionId);

        // Handle infrastructure concerns: clear security context and invalidate session
        SecurityContextHolder.clearContext();
        session.invalidate();

        return authenticationMapper.toRestResponse(response);
    }

    /**
     * Extracts AuthenticatedUser from Spring Security context.
     *
     * @return Optional containing the authenticated user, empty if not
     *         authenticated
     */
    private Optional<AuthenticatedUser> extractAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return Optional.empty();
        }

        try {
            return Optional.of(authenticationMapper.toDomain(authentication));
        } catch (UserNotFoundException e) {
            log.warn("Authenticated user found in security context but missing in database: {}", e.getMessage());
            return Optional.empty();
        } catch (Exception e) {
            log.error("Unexpected error during authentication mapping", e);
            return Optional.empty();
        }
    }
}
