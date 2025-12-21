package edu.kit.quak.integration.user;

import edu.kit.quak.infrastructure.user.out.db.jpa.entity.JpaUser;
import edu.kit.quak.infrastructure.user.out.db.jpa.repository.SpringDataUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oidcLogin;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for User-related endpoints.
 * Tests the full request/response cycle including security.
 */
@SpringBootTest
@AutoConfigureMockMvc
class UserIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SpringDataUserRepository userRepository;

    private JpaUser testUser;

    @BeforeEach
    void setUp() {
        // Create a test user if not exists
        // The oidcLogin() mock uses "test" as the registration ID by default in our
        // tests
        testUser = userRepository.findByIssuerAndSub("test", "test-sub")
                .orElseGet(() -> {
                    JpaUser user = new JpaUser();
                    user.setIssuer("test"); // Match the test's OIDC mock registration ID
                    user.setSub("test-sub");
                    user.setEmail("test@example.com");
                    user.setName("Test User");
                    user.setEmailVerified(true);
                    return userRepository.save(user);
                });
    }

    private org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.OidcLoginRequestPostProcessor authenticatedUser() {
        return oidcLogin()
                .idToken(token -> token
                        .claim("sub", "test-sub")
                        .claim("email", "test@example.com")
                        .claim("name", "Test User")
                        .claim("picture", "https://example.com/avatar.jpg"))
                .clientRegistration(org.springframework.security.oauth2.client.registration.ClientRegistration
                        .withRegistrationId("test")
                        .clientId("test-client-id")
                        .authorizationGrantType(
                                org.springframework.security.oauth2.core.AuthorizationGrantType.AUTHORIZATION_CODE)
                        .redirectUri("http://localhost/callback")
                        .authorizationUri("http://localhost/authorize")
                        .tokenUri("http://localhost/token")
                        .build());
    }

    @Nested
    @DisplayName("GET /api/me Endpoint")
    class GetMeEndpointTests {

        @Test
        @DisplayName("Should return 401 when not authenticated")
        void getMeEndpoint_unauthenticated_returns401() throws Exception {
            mockMvc.perform(get("/api/me"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("Should return user data when authenticated")
        void getMeEndpoint_authenticated_returnsUserData() throws Exception {
            mockMvc.perform(get("/api/me").with(authenticatedUser()))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType("application/json"))
                    .andExpect(jsonPath("$.userId").exists())
                    .andExpect(jsonPath("$.email").value("test@example.com"))
                    .andExpect(jsonPath("$.name").value("Test User"));
        }
    }

    @Nested
    @DisplayName("GET /api/auth/status Endpoint")
    class AuthStatusEndpointTests {

        @Test
        @DisplayName("Should return authenticated=false when not logged in")
        void authStatus_notLoggedIn_returnsFalse() throws Exception {
            mockMvc.perform(get("/api/auth/status"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.authenticated").value(false));
        }

        @Test
        @DisplayName("Should return authenticated=true when logged in")
        void authStatus_loggedIn_returnsTrue() throws Exception {
            mockMvc.perform(get("/api/auth/status").with(authenticatedUser()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.authenticated").value(true))
                    .andExpect(jsonPath("$.user").exists())
                    .andExpect(jsonPath("$.user.email").value("test@example.com"));
        }
    }

    @Nested
    @DisplayName("GET /api/auth/user Endpoint")
    class AuthUserEndpointTests {

        @Test
        @DisplayName("Should return user info when authenticated")
        void authUser_authenticated_returnsUserInfo() throws Exception {
            mockMvc.perform(get("/api/auth/user").with(authenticatedUser()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.email").value("test@example.com"))
                    .andExpect(jsonPath("$.name").value("Test User"))
                    .andExpect(jsonPath("$.sub").value("test-sub"));
        }
    }

    @Nested
    @DisplayName("POST /api/auth/logout Endpoint")
    class LogoutEndpointTests {

        @Test
        @DisplayName("Should successfully logout authenticated user")
        void logout_authenticated_success() throws Exception {
            mockMvc.perform(post("/api/auth/logout")
                    .with(csrf())
                    .with(authenticatedUser()))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("Should allow logout even when not authenticated")
        void logout_notAuthenticated_success() throws Exception {
            mockMvc.perform(post("/api/auth/logout").with(csrf()))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("Security Tests")
    class SecurityTests {

        @Test
        @DisplayName("Protected endpoints should require authentication")
        void protectedEndpoints_requireAuth() throws Exception {
            // /api/me requires authentication
            mockMvc.perform(get("/api/me"))
                    .andExpect(status().isUnauthorized());

            // /api/projects requires authentication
            mockMvc.perform(get("/api/projects"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("Public endpoints should be accessible without authentication")
        void publicEndpoints_noAuthRequired() throws Exception {
            // /api/auth/status is public
            mockMvc.perform(get("/api/auth/status"))
                    .andExpect(status().isOk());
        }
    }
}
