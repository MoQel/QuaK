package edu.kit.quak.application.user.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AuthService.
 * Tests authentication status, user info retrieval, and logout functionality.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @InjectMocks
    private AuthService authService;

    private static final String TEST_SESSION_ID = "test-session-123";

    @BeforeEach
    void setUp() {
        // Clear security context before each test
        SecurityContextHolder.clearContext();
    }

    @Nested
    @DisplayName("getAuthenticationStatus Tests")
    class GetAuthenticationStatusTests {

        @Test
        @DisplayName("Should return authenticated=false when no authentication")
        void getAuthenticationStatus_noAuth_returnsFalse() {
            SecurityContext context = mock(SecurityContext.class);
            when(context.getAuthentication()).thenReturn(null);
            SecurityContextHolder.setContext(context);

            Map<String, Object> result = authService.getAuthenticationStatus();

            assertFalse((Boolean) result.get("authenticated"));
        }

        @Test
        @DisplayName("Should return authenticated=false for anonymous user")
        void getAuthenticationStatus_anonymousUser_returnsFalse() {
            SecurityContext context = mock(SecurityContext.class);
            Authentication auth = mock(Authentication.class);
            when(context.getAuthentication()).thenReturn(auth);
            when(auth.isAuthenticated()).thenReturn(true);
            when(auth.getPrincipal()).thenReturn("anonymousUser");
            SecurityContextHolder.setContext(context);

            Map<String, Object> result = authService.getAuthenticationStatus();

            assertFalse((Boolean) result.get("authenticated"));
        }

        @Test
        @DisplayName("Should return authenticated=true with user info for OAuth2 user")
        void getAuthenticationStatus_oauth2User_returnsTrueWithUserInfo() {
            SecurityContext context = mock(SecurityContext.class);
            Authentication auth = mock(Authentication.class);
            OAuth2User oauth2User = mock(OAuth2User.class);

            when(context.getAuthentication()).thenReturn(auth);
            when(auth.isAuthenticated()).thenReturn(true);
            when(auth.getPrincipal()).thenReturn(oauth2User);
            when(oauth2User.getAttribute("email")).thenReturn("test@example.com");
            when(oauth2User.getAttribute("name")).thenReturn("Test User");
            when(oauth2User.getAttribute("picture")).thenReturn("https://example.com/pic.jpg");
            SecurityContextHolder.setContext(context);

            Map<String, Object> result = authService.getAuthenticationStatus();

            assertTrue((Boolean) result.get("authenticated"));
            assertNotNull(result.get("user"));

            @SuppressWarnings("unchecked")
            Map<String, Object> userInfo = (Map<String, Object>) result.get("user");
            assertEquals("test@example.com", userInfo.get("email"));
            assertEquals("Test User", userInfo.get("name"));
            assertEquals("https://example.com/pic.jpg", userInfo.get("picture"));
        }
    }

    @Nested
    @DisplayName("getAuthenticatedUserInfo Tests")
    class GetAuthenticatedUserInfoTests {

        @Test
        @DisplayName("Should return user info for OAuth2 user")
        void getAuthenticatedUserInfo_oauth2User_returnsUserInfo() {
            SecurityContext context = mock(SecurityContext.class);
            Authentication auth = mock(Authentication.class);
            OAuth2User oauth2User = mock(OAuth2User.class);

            when(context.getAuthentication()).thenReturn(auth);
            when(auth.getPrincipal()).thenReturn(oauth2User);
            when(oauth2User.getAttribute("email")).thenReturn("test@example.com");
            when(oauth2User.getAttribute("name")).thenReturn("Test User");
            when(oauth2User.getAttribute("picture")).thenReturn("https://example.com/pic.jpg");
            when(oauth2User.getAttribute("sub")).thenReturn("sub-123");
            SecurityContextHolder.setContext(context);

            Map<String, Object> result = authService.getAuthenticatedUserInfo();

            assertEquals("test@example.com", result.get("email"));
            assertEquals("Test User", result.get("name"));
            assertEquals("https://example.com/pic.jpg", result.get("picture"));
            assertEquals("sub-123", result.get("sub"));
        }

        @Test
        @DisplayName("Should throw exception when not authenticated")
        void getAuthenticatedUserInfo_notAuthenticated_throwsException() {
            SecurityContext context = mock(SecurityContext.class);
            when(context.getAuthentication()).thenReturn(null);
            SecurityContextHolder.setContext(context);

            assertThrows(RuntimeException.class,
                    () -> authService.getAuthenticatedUserInfo());
        }

        @Test
        @DisplayName("Should throw exception when principal is not OAuth2User")
        void getAuthenticatedUserInfo_nonOAuth2Principal_throwsException() {
            SecurityContext context = mock(SecurityContext.class);
            Authentication auth = mock(Authentication.class);
            when(context.getAuthentication()).thenReturn(auth);
            when(auth.getPrincipal()).thenReturn("notOAuth2User");
            SecurityContextHolder.setContext(context);

            assertThrows(RuntimeException.class,
                    () -> authService.getAuthenticatedUserInfo());
        }
    }

    @Nested
    @DisplayName("logout Tests")
    class LogoutTests {

        @Test
        @DisplayName("Should clear security context")
        void logout_clearsSecurityContext() {
            // Set up a security context
            SecurityContext context = mock(SecurityContext.class);
            SecurityContextHolder.setContext(context);

            Map<String, String> result = authService.logout(TEST_SESSION_ID);

            assertEquals("Logged out successfully", result.get("message"));

            // Verify security context was cleared
            assertNull(SecurityContextHolder.getContext().getAuthentication());
        }

        @Test
        @DisplayName("Should return success message on logout")
        void logout_returnsSuccessMessage() {
            Map<String, String> result = authService.logout(TEST_SESSION_ID);

            assertNotNull(result);
            assertEquals("Logged out successfully", result.get("message"));
        }
    }
}
