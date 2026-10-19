package edu.kit.quak.infrastructure.user.in.web.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import edu.kit.quak.application.user.ports.in.OidcSyncServicePort;
import edu.kit.quak.shared.tags.UnitTest;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;

@UnitTest
@ExtendWith(MockitoExtension.class)
class OAuth2LoginSuccessHandlerTest {

    private static final String FRONTEND_URL = "http://frontend";

    @Mock
    OidcSyncServicePort oidcSyncService;

    @Test
    @DisplayName("an OAuth2 login syncs the user and redirects to the frontend")
    void syncsOAuthUserAndRedirects() throws Exception {
        DefaultOAuth2User principal = new DefaultOAuth2User(AuthorityUtils.createAuthorityList("ROLE_USER"), Map.of("sub", "abc"), "sub");
        MockHttpServletResponse response = new MockHttpServletResponse();

        new OAuth2LoginSuccessHandler(oidcSyncService, FRONTEND_URL).onAuthenticationSuccess(
            new MockHttpServletRequest(),
            response,
            new OAuth2AuthenticationToken(principal, principal.getAuthorities(), "google")
        );

        verify(oidcSyncService).syncUser(eq("google"), argThat(info -> "abc".equals(info.sub())));
        assertEquals(FRONTEND_URL + "/", response.getRedirectedUrl());
    }

    @Test
    @DisplayName("a non-OAuth2 login only redirects to the frontend")
    void redirectsOtherLogins() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();

        new OAuth2LoginSuccessHandler(oidcSyncService, FRONTEND_URL).onAuthenticationSuccess(
            new MockHttpServletRequest(),
            response,
            new TestingAuthenticationToken("admin", null)
        );

        verifyNoInteractions(oidcSyncService);
        assertEquals(FRONTEND_URL + "/", response.getRedirectedUrl());
    }
}
