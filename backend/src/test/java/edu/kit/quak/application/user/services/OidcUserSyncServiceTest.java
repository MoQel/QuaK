package edu.kit.quak.application.user.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

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
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

/** Unit tests for OidcUserSyncService. Tests user synchronization logic during OIDC login. */
@ExtendWith(MockitoExtension.class)
class OidcUserSyncServiceTest {

    @Mock private UserRepositoryPort userRepository;

    @InjectMocks private OidcUserSyncService oidcUserSyncService;

    private OidcUser createMockOidcUser() {
        OidcUser mockOidcUser = mock(OidcUser.class);
        when(mockOidcUser.getSubject()).thenReturn("test-sub-123");
        when(mockOidcUser.getEmail()).thenReturn("test@example.com");
        when(mockOidcUser.getEmailVerified()).thenReturn(true);
        when(mockOidcUser.getFullName()).thenReturn("Test User");
        when(mockOidcUser.getGivenName()).thenReturn("Test");
        when(mockOidcUser.getFamilyName()).thenReturn("User");
        when(mockOidcUser.getPicture()).thenReturn("https://example.com/avatar.jpg");
        return mockOidcUser;
    }

    @Nested
    @DisplayName("syncUser - New User Creation")
    class NewUserCreationTests {

        @Test
        @DisplayName("Should create new user when user does not exist")
        void syncUser_newUser_createsUser() {
            OidcUser mockOidcUser = createMockOidcUser();
            // Arrange
            when(userRepository.findByIssuerAndSub("google", "test-sub-123"))
                    .thenReturn(Optional.empty());

            User savedUser = new User(UUID.randomUUID(), "google", "test-sub-123");
            savedUser.setEmail("test@example.com");
            when(userRepository.save(any(User.class))).thenReturn(savedUser);

            // Act
            User result = oidcUserSyncService.syncUser("google", mockOidcUser);

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
            OidcUser minimalOidcUser = mock(OidcUser.class);
            when(minimalOidcUser.getSubject()).thenReturn("minimal-sub");
            when(minimalOidcUser.getEmail()).thenReturn(null);
            when(minimalOidcUser.getEmailVerified()).thenReturn(null);
            when(minimalOidcUser.getFullName()).thenReturn(null);
            when(minimalOidcUser.getGivenName()).thenReturn(null);
            when(minimalOidcUser.getFamilyName()).thenReturn(null);
            when(minimalOidcUser.getPicture()).thenReturn(null);

            when(userRepository.findByIssuerAndSub("github", "minimal-sub"))
                    .thenReturn(Optional.empty());
            when(userRepository.save(any(User.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            User result = oidcUserSyncService.syncUser("github", minimalOidcUser);

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
            OidcUser mockOidcUser = createMockOidcUser();
            // Arrange
            UUID existingUserId = UUID.randomUUID();
            User existingUser = new User(existingUserId, "google", "test-sub-123");
            existingUser.setEmail("old@example.com");
            existingUser.setName("Old Name");

            when(userRepository.findByIssuerAndSub("google", "test-sub-123"))
                    .thenReturn(Optional.of(existingUser));
            when(userRepository.save(any(User.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            User result = oidcUserSyncService.syncUser("google", mockOidcUser);

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
            OidcUser mockOidcUser = createMockOidcUser();
            // Arrange
            UUID existingUserId = UUID.randomUUID();
            User existingUser = new User(existingUserId, "google", "test-sub-123");

            when(userRepository.findByIssuerAndSub("google", "test-sub-123"))
                    .thenReturn(Optional.of(existingUser));
            when(userRepository.save(any(User.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            User result = oidcUserSyncService.syncUser("google", mockOidcUser);

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
            OidcUser nullSubjectUser = mock(OidcUser.class);
            when(nullSubjectUser.getSubject()).thenReturn(null);

            // Act & Assert
            assertThrows(
                    IllegalArgumentException.class,
                    () -> oidcUserSyncService.syncUser("google", nullSubjectUser));

            verify(userRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("syncUser - Different Issuers")
    class DifferentIssuersTests {

        @Test
        @DisplayName("Should create separate users for different issuers with same sub")
        void syncUser_differentIssuers_createsSeparateUsers() {
            OidcUser mockOidcUser = createMockOidcUser();
            // Arrange
            when(userRepository.findByIssuerAndSub("google", "test-sub-123"))
                    .thenReturn(Optional.empty());
            when(userRepository.findByIssuerAndSub("github", "test-sub-123"))
                    .thenReturn(Optional.empty());
            when(userRepository.save(any(User.class)))
                    .thenAnswer(
                            invocation -> {
                                User u = invocation.getArgument(0);
                                u.setId(UUID.randomUUID());
                                return u;
                            });

            // Act
            User googleUser = oidcUserSyncService.syncUser("google", mockOidcUser);
            User githubUser = oidcUserSyncService.syncUser("github", mockOidcUser);

            // Assert
            assertNotEquals(googleUser.getId(), githubUser.getId());
            assertEquals("google", googleUser.getIssuer());
            assertEquals("github", githubUser.getIssuer());

            verify(userRepository, times(2)).save(any(User.class));
        }
    }
}
