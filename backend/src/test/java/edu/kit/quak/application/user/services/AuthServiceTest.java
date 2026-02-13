package edu.kit.quak.application.user.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

import edu.kit.quak.application.user.dto.AuthStatusResponse;
import edu.kit.quak.application.user.dto.LogoutResponse;
import edu.kit.quak.application.user.ports.out.UserRepositoryPort;
import edu.kit.quak.core.user.model.AuthenticatedUser;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for AuthService. Tests authentication status and logout functionality.
 *
 * <p>Note: These tests are framework-agnostic since the refactored AuthService works only with
 * domain concepts (AuthenticatedUser) and not Spring Security.
 */
class AuthServiceTest {

    private AuthService authService;
    private UserRepositoryPort userRepository;

    private static final String TEST_SESSION_ID = "test-session-123";
    private static final UUID TEST_USER_ID = UUID.randomUUID();
    private static final String TEST_ISSUER = "google";
    private static final String TEST_SUBJECT = "sub-123";

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepositoryPort.class);
        authService = new AuthService(userRepository);
    }

    @Nested
    @DisplayName("getAuthenticationStatus Tests")
    class GetAuthenticationStatusTests {

        @Test
        @DisplayName("Should return authenticated=false when no authenticated user")
        void getAuthenticationStatus_noAuth_returnsFalse() {
            AuthStatusResponse result = authService.getAuthenticationStatus(Optional.empty());

            assertFalse(result.authenticated());
            assertNull(result.user());
        }

        @Test
        @DisplayName("Should return authenticated=true with user domain model for authenticated user")
        void getAuthenticationStatus_authenticatedUser_returnsTrueWithUser() {
            AuthenticatedUser authenticatedUser = new AuthenticatedUser(TEST_USER_ID, TEST_ISSUER, TEST_SUBJECT);

            // Create a mock User object
            edu.kit.quak.core.user.model.User mockUser = new edu.kit.quak.core.user.model.User();
            mockUser.setId(TEST_USER_ID);
            mockUser.setIssuer(TEST_ISSUER);
            mockUser.setSub(TEST_SUBJECT);
            mockUser.setEmail("test@example.com");
            mockUser.setName("Test User");
            mockUser.setAvatarUrl("https://example.com/avatar.jpg");

            // Mock the repository to return the user
            org.mockito.Mockito.when(userRepository.findByIssuerAndSub(TEST_ISSUER, TEST_SUBJECT))
                    .thenReturn(Optional.of(mockUser));

            AuthStatusResponse result = authService.getAuthenticationStatus(Optional.of(authenticatedUser));

            assertTrue(result.authenticated());
            assertNotNull(result.user());

            edu.kit.quak.core.user.model.User returnedUser = result.user();
            assertEquals(TEST_USER_ID, returnedUser.getId());
            assertEquals(TEST_ISSUER, returnedUser.getIssuer());
            assertEquals(TEST_SUBJECT, returnedUser.getSub());
            assertEquals("test@example.com", returnedUser.getEmail());
            assertEquals("Test User", returnedUser.getName());
            assertEquals("https://example.com/avatar.jpg", returnedUser.getAvatarUrl());
        }
    }

    @Nested
    @DisplayName("logout Tests")
    class LogoutTests {

        @Test
        @DisplayName("Should return success message on logout")
        void logout_returnsSuccessMessage() {
            LogoutResponse result = authService.logout(TEST_SESSION_ID);

            assertNotNull(result);
            assertEquals("Logged out successfully", result.message());
        }

        @Test
        @DisplayName("Should handle null session ID gracefully")
        void logout_nullSessionId_returnsSuccessMessage() {
            LogoutResponse result = authService.logout(null);

            assertNotNull(result);
            assertEquals("Logged out successfully", result.message());
        }
    }
}
