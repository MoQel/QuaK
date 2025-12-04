package edu.kit.quak.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @GetMapping("/status")
    public Map<String, Object> getAuthStatus(HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.isAuthenticated() 
            && !"anonymousUser".equals(authentication.getPrincipal())) {
            
            response.put("authenticated", true);
            
            if (authentication.getPrincipal() instanceof OAuth2User) {
                OAuth2User user = (OAuth2User) authentication.getPrincipal();
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

    @GetMapping("/user")
    public Map<String, Object> getUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.getPrincipal() instanceof OAuth2User) {
            OAuth2User user = (OAuth2User) authentication.getPrincipal();
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("email", user.getAttribute("email"));
            userInfo.put("name", user.getAttribute("name"));
            userInfo.put("picture", user.getAttribute("picture"));
            userInfo.put("sub", user.getAttribute("sub"));
            return userInfo;
        }
        
        throw new RuntimeException("User not authenticated");
    }

    @PostMapping("/logout")
    public Map<String, String> logout(HttpSession session) {
        session.invalidate();
        SecurityContextHolder.clearContext();
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Logged out successfully");
        return response;
    }
}
