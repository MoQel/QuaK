package edu.kit.quak.application.user.services;

import edu.kit.quak.core.user.model.AuthenticatedUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for AuthService.
 * Tests authentication status, user info retrieval, and logout functionality.
 * 
 * Note: These tests are framework-agnostic since the refactored AuthService
 * works only with domain concepts (AuthenticatedUser) and not Spring Security.
 */
class AuthServiceTest {

    private AuthService authService;

    private static final String TEST_SESSION_ID = "test-session-123";
    private static final UUID TEST_USER_ID = UUID.randomUUID();
    private static final String TEST_ISSUER = "google";
    private static final String TEST_SUBJECT = "sub-123";

    @BeforeEach
    void setUp() {
        authService = new AuthService();
    }

    @Nested
    @DisplayName("getAuthenticationStatus Tests")
    class GetAuthenticationStatusTests {

        @Test
        @DisplayName("Should return authenticated=false when no authenticated user")
        void getAuthenticationStatus_noAuth_returnsFalse() {
            Map<String, Object> result = authService.getAuthenticationStatus(
                    Optional.empty(),
                    Optional.empty());

            assertFalse((Boolean) result.get("authenticated"));
            assertNull(result.get("user"));
        }

        @Test
        @DisplayName("Should return authenticated=true with user info for authenticated user")
        void getAuthenticationStatus_authenticatedUser_returnsTrueWithUserInfo() {
            AuthenticatedUser authenticatedUser = new AuthenticatedUser(
                    TEST_USER_ID, TEST_ISSUER, TEST_SUBJECT);

            Map<String, Object> userInfo = createUserInfo();

            Map<String, Object> result = authService.getAuthenticationStatus(
                    Optional.of(authenticatedUser),
                    Optional.of(userInfo));

            assertTrue((Boolean) result.get("authenticated"));
            assertNotNull(result.get("user"));

            @SuppressWarnings("unchecked")
            Map<String, Object> returnedUserInfo = (Map<String, Object>) result.get("user");
            assertEquals("test@example.com", returnedUserInfo.get("email"));
            assertEquals("Test User", returnedUserInfo.get("name"));
            assertEquals("https://example.com/pic.jpg", returnedUserInfo.get("picture"));
        }

        @Test
        @DisplayName("Should return authenticated=true without user info when not provided")
        void getAuthenticationStatus_authenticatedWithoutUserInfo_returnsTrueWithoutUserInfo() {
            AuthenticatedUser authenticatedUser = new AuthenticatedUser(
                    TEST_USER_ID, TEST_ISSUER, TEST_SUBJECT);

            Map<String, Object> result = authService.getAuthenticationStatus(
                    Optional.of(authenticatedUser),
                    Optional.empty());

            assertTrue((Boolean) result.get("authenticated"));
            assertNull(result.get("user"));
        }
    }

    @Nested
    @DisplayName("getAuthenticatedUserInfo Tests")
    class GetAuthenticatedUserInfoTests {

        @Test
        @DisplayName("Should return user info for authenticated user")
        void getAuthenticatedUserInfo_authenticatedUser_returnsUserInfo() {
            AuthenticatedUser authenticatedUser = new AuthenticatedUser(
                    TEST_USER_ID, TEST_ISSUER, TEST_SUBJECT);
            Map<String, Object> userInfo = createUserInfoWithSub();

            Map<String, Object> result = authService.getAuthenticatedUserInfo(
                    authenticatedUser,
                    userInfo);

            assertEquals("test@example.com", result.get("email"));
            assertEquals("Test User", result.get("name"));
            assertEquals("https://example.com/pic.jpg", result.get("picture"));
            assertEquals("sub-123", result.get("sub"));
        }

        @Test
        @DisplayName("Should throw exception when authenticated user is null")
        void getAuthenticatedUserInfo_nullUser_throwsException() {
            Map<String, Object> userInfo = createUserInfoWithSub();

            assertThrows(IllegalStateException.class,
                    () -> authService.getAuthenticatedUserInfo(null, userInfo));
        }
    }

    @Nested
    @DisplayName("logout Tests")
    class LogoutTests {

        @Test
        @DisplayName("Should return success message on logout")
        void logout_returnsSuccessMessage() {
            Map<String, String> result = authService.logout(TEST_SESSION_ID);

            assertNotNull(result);
            assertEquals("Logged out successfully", result.get("message"));
        }

        @Test
        @DisplayName("Should handle null session ID gracefully")
        void logout_nullSessionId_returnsSuccessMessage() {
            Map<String, String> result = authService.logout(null);

            assertNotNull(result);
            assertEquals("Logged out successfully", result.get("message"));
        }
    }

    private Map<String, Object> createUserInfo() {
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("email", "test@example.com");
        userInfo.put("name", "Test User");
        userInfo.put("picture", "https://example.com/pic.jpg");
        return userInfo;
    }

    private Map<String, Object> createUserInfoWithSub() {
        Map<String, Object> userInfo = createUserInfo();
        userInfo.put("sub", "sub-123");
        return userInfo;
    }
}
