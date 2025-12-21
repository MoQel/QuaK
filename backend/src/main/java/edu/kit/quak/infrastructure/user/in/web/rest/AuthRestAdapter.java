package edu.kit.quak.infrastructure.user.in.web.rest;

import edu.kit.quak.application.user.ports.in.AuthServicePort;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST adapter for authentication-related endpoints.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthRestAdapter {

    private final AuthServicePort authService;

    public AuthRestAdapter(@Qualifier("newAuthService") AuthServicePort authService) {
        this.authService = authService;
    }

    @GetMapping("/status")
    public Map<String, Object> getAuthStatus(HttpSession session) {
        return authService.getAuthenticationStatus();
    }

    @GetMapping("/user")
    public Map<String, Object> getUser() {
        return authService.getAuthenticatedUserInfo();
    }

    @PostMapping("/logout")
    public Map<String, String> logout(HttpSession session) {
        return authService.logout(session);
    }
}
