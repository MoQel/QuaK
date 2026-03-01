package edu.kit.quak.application.user.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import edu.kit.quak.application.user.ports.in.OidcUserInfo;
import edu.kit.quak.application.user.ports.out.UserRepositoryPort;
import edu.kit.quak.core.user.model.User;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/** Unit tests for OidcUserSyncService. Tests user synchronization logic during OIDC login. */
@ExtendWith(MockitoExtension.class)
class OidcUserSyncServiceTest {

    @Mock
    private UserRepositoryPort userRepository;

    @InjectMocks
    private OidcUserSyncService oidcUserSyncService;

    private OidcUserInfo createUserInfo() {
        return new OidcUserInfo("test-sub-123", "test@example.com", true, "Test User", "Test", "User", "https://example.com/avatar.jpg");
    }

    @Nested
    @DisplayName("syncUser - New User Creation")
    class NewUserCreationTests {

        @Test
        @DisplayName("Should create new user when user does not exist")
        void syncUser_newUser_createsUser() {
            OidcUserInfo userInfo = createUserInfo();
            // Arrange
            when(userRepository.findByIssuerAndSub("google", "test-sub-123")).thenReturn(Optional.empty());

            User savedUser = new User(UUID.randomUUID(), "google", "test-sub-123");
            savedUser.setEmail("test@example.com");
            when(userRepository.save(any(User.class))).thenReturn(savedUser);

            // Act
            User result = oidcUserSyncService.syncUser("google", userInfo);

            // Assert
            assertNotNull(result);

            // Verify save was called with correct data
            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(userCaptor.capture());

            User capturedUser = userCaptor.getValue();
            assertEquals("google", capturedUser.getIssuer());
            assertEquals("test-sub-123", capturedUser.getSub());
            assertEquals("test@example.com", capturedUser.getEmail());
            assertEquals(true, capturedUser.getEmailVerified());
            assertEquals("Test User", capturedUser.getName());
            assertEquals("Test", capturedUser.getGivenName());
            assertEquals("User", capturedUser.getFamilyName());
            assertEquals("https://example.com/avatar.jpg", capturedUser.getAvatarUrl());
            assertNotNull(capturedUser.getLastLoginAt());
        }

        @Test
        @DisplayName("Should handle user with minimal OIDC claims")
        void syncUser_minimalClaims_createsUser() {
            // Arrange
            OidcUserInfo minimalUserInfo = new OidcUserInfo("minimal-sub", null, null, null, null, null, null);

            when(userRepository.findByIssuerAndSub("github", "minimal-sub")).thenReturn(Optional.empty());
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            User result = oidcUserSyncService.syncUser("github", minimalUserInfo);

            // Assert
            assertNotNull(result);
            assertEquals("github", result.getIssuer());
            assertEquals("minimal-sub", result.getSub());
            assertNull(result.getEmail());
        }
    }

    @Nested
    @DisplayName("syncUser - Existing User Update")
    class ExistingUserUpdateTests {

        @Test
        @DisplayName("Should update existing user with new OIDC data")
        void syncUser_existingUser_updatesUser() {
            OidcUserInfo userInfo = createUserInfo();
            // Arrange
            UUID existingUserId = UUID.randomUUID();
            User existingUser = new User(existingUserId, "google", "test-sub-123");
            existingUser.setEmail("old@example.com");
            existingUser.setName("Old Name");

            when(userRepository.findByIssuerAndSub("google", "test-sub-123")).thenReturn(Optional.of(existingUser));
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            User result = oidcUserSyncService.syncUser("google", userInfo);

            // Assert
            assertNotNull(result);
            assertEquals(existingUserId, result.getId());
            assertEquals("test@example.com", result.getEmail()); // Updated
            assertEquals("Test User", result.getName()); // Updated
            assertEquals(true, result.getEmailVerified());
            assertNotNull(result.getLastLoginAt());

            verify(userRepository).save(existingUser);
        }

        @Test
        @DisplayName("Should preserve user ID when updating")
        void syncUser_existingUser_preservesId() {
            OidcUserInfo userInfo = createUserInfo();
            // Arrange
            UUID existingUserId = UUID.randomUUID();
            User existingUser = new User(existingUserId, "google", "test-sub-123");

            when(userRepository.findByIssuerAndSub("google", "test-sub-123")).thenReturn(Optional.of(existingUser));
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            User result = oidcUserSyncService.syncUser("google", userInfo);

            // Assert
            assertEquals(existingUserId, result.getId());
            assertEquals("google", result.getIssuer());
            assertEquals("test-sub-123", result.getSub());
        }
    }

    @Nested
    @DisplayName("syncUser - Error Handling")
    class ErrorHandlingTests {

        @Test
        @DisplayName("Should throw IllegalArgumentException when subject is null")
        void syncUser_nullSubject_throwsException() {
            // Arrange
            OidcUserInfo nullSubUserInfo = new OidcUserInfo(null, null, null, null, null, null, null);

            // Act & Assert
            assertThrows(IllegalArgumentException.class, () -> oidcUserSyncService.syncUser("google", nullSubUserInfo));

            verify(userRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("syncUser - Different Issuers")
    class DifferentIssuersTests {

        @Test
        @DisplayName("Should create separate users for different issuers with same sub")
        void syncUser_differentIssuers_createsSeparateUsers() {
            OidcUserInfo userInfo = createUserInfo();
            // Arrange
            when(userRepository.findByIssuerAndSub("google", "test-sub-123")).thenReturn(Optional.empty());
            when(userRepository.findByIssuerAndSub("github", "test-sub-123")).thenReturn(Optional.empty());
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User u = invocation.getArgument(0);
                u.setId(UUID.randomUUID());
                return u;
            });

            // Act
            User googleUser = oidcUserSyncService.syncUser("google", userInfo);
            User githubUser = oidcUserSyncService.syncUser("github", userInfo);

            // Assert
            assertNotEquals(googleUser.getId(), githubUser.getId());
            assertEquals("google", googleUser.getIssuer());
            assertEquals("github", githubUser.getIssuer());

            verify(userRepository, times(2)).save(any(User.class));
        }
    }
}
