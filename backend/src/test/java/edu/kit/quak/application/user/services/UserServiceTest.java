package edu.kit.quak.application.user.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import edu.kit.quak.application.user.exceptions.UserNotFoundException;
import edu.kit.quak.application.user.ports.out.UserRepositoryPort;
import edu.kit.quak.core.user.model.AuthenticatedUser;
import edu.kit.quak.core.user.model.User;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/** Unit tests for UserService. Tests user retrieval logic. */
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepositoryPort userRepository;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private UUID testUserId;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        testUser = new User(testUserId, "google", "test-sub-123");
        testUser.setEmail("test@example.com");
        testUser.setName("Test User");
    }

    @Nested
    @DisplayName("findById Tests")
    class FindByIdTests {

        @Test
        @DisplayName("Should return user when user exists")
        void findById_existingUser_returnsUser() {
            when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

            Optional<User> result = userService.findById(testUserId);

            assertTrue(result.isPresent());
            assertEquals(testUserId, result.get().getId());
            assertEquals("google", result.get().getIssuer());
            assertEquals("test-sub-123", result.get().getSub());
            verify(userRepository).findById(testUserId);
        }

        @Test
        @DisplayName("Should return empty when user does not exist")
        void findById_nonExistingUser_returnsEmpty() {
            UUID nonExistentId = UUID.randomUUID();
            when(userRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            Optional<User> result = userService.findById(nonExistentId);

            assertFalse(result.isPresent());
            verify(userRepository).findById(nonExistentId);
        }
    }

    @Nested
    @DisplayName("findByIssuerAndSub Tests")
    class FindByIssuerAndSubTests {

        @Test
        @DisplayName("Should return user when issuer and sub match")
        void findByIssuerAndSub_existingUser_returnsUser() {
            when(userRepository.findByIssuerAndSub("google", "test-sub-123")).thenReturn(Optional.of(testUser));

            Optional<User> result = userService.findByIssuerAndSub("google", "test-sub-123");

            assertTrue(result.isPresent());
            assertEquals("google", result.get().getIssuer());
            assertEquals("test-sub-123", result.get().getSub());
            verify(userRepository).findByIssuerAndSub("google", "test-sub-123");
        }

        @Test
        @DisplayName("Should return empty when issuer and sub do not match")
        void findByIssuerAndSub_nonExistingUser_returnsEmpty() {
            when(userRepository.findByIssuerAndSub("github", "unknown-sub")).thenReturn(Optional.empty());

            Optional<User> result = userService.findByIssuerAndSub("github", "unknown-sub");

            assertFalse(result.isPresent());
            verify(userRepository).findByIssuerAndSub("github", "unknown-sub");
        }
    }

    @Nested
    @DisplayName("getAuthenticatedUser Tests")
    class GetAuthenticatedUserTests {

        @Test
        @DisplayName("Should return user when authenticated user exists in database")
        void getAuthenticatedUser_existingUser_returnsUser() {
            // Arrange
            AuthenticatedUser authenticatedUser = new AuthenticatedUser(null, "google", "test-sub-123");
            when(userRepository.findByIssuerAndSub("google", "test-sub-123")).thenReturn(Optional.of(testUser));

            // Act
            User result = userService.getAuthenticatedUser(authenticatedUser);

            // Assert
            assertNotNull(result);
            assertEquals(testUserId, result.getId());
            assertEquals("google", result.getIssuer());
        }

        @Test
        @DisplayName("Should throw UserNotFoundException when user not found")
        void getAuthenticatedUser_userNotFound_throwsException() {
            // Arrange
            AuthenticatedUser authenticatedUser = new AuthenticatedUser(null, "google", "unknown-sub");
            when(userRepository.findByIssuerAndSub("google", "unknown-sub")).thenReturn(Optional.empty());

            // Act & Assert
            UserNotFoundException exception = assertThrows(UserNotFoundException.class, () ->
                userService.getAuthenticatedUser(authenticatedUser)
            );
            assertTrue(exception.getMessage().contains("google"));
            assertTrue(exception.getMessage().contains("unknown-sub"));
        }
    }
}
