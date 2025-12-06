package edu.kit.quak.infrastructure.web.rest;

import edu.kit.quak.application.filesystem.service.AuthService;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;
import java.util.Map;

/**
 * REST controller for authentication-related endpoints.
 * Delegates business logic to AuthService.
 *
 * @author QuaK Team
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
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
