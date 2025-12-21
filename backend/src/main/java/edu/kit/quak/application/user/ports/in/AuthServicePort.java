package edu.kit.quak.application.user.ports.in;

import jakarta.servlet.http.HttpSession;
import java.util.Map;

/**
 * Input port for authentication operations.
 */
public interface AuthServicePort {
    Map<String, Object> getAuthenticationStatus();
    Map<String, Object> getAuthenticatedUserInfo();
    Map<String, String> logout(HttpSession session);
}
