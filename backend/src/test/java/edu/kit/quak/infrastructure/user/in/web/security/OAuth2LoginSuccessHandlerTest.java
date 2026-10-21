package edu.kit.quak.infrastructure.user.in.web.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import edu.kit.quak.application.user.dto.SignInOutcome;
import edu.kit.quak.application.user.ports.in.OAuthSignInServicePort;
import edu.kit.quak.shared.tags.UnitTest;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;

@UnitTest
@ExtendWith(MockitoExtension.class)
class OAuth2LoginSuccessHandlerTest {

    private static final String FRONTEND_URL = "http://frontend";

    @Mock
    OAuthSignInServicePort signInService;

    @Mock
    GuestSessionAuthenticator guestSessionAuthenticator;

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("a signed-in account is redirected to the frontend")
    void redirectsSignedInAccount() throws Exception {
        when(signInService.signIn(eq("google"), argThat(info -> "abc".equals(info.sub())))).thenReturn(SignInOutcome.SIGNED_IN);
        MockHttpServletResponse response = new MockHttpServletResponse();

        handler().onAuthenticationSuccess(new MockHttpServletRequest(), response, oauthToken("google"));

        assertEquals(FRONTEND_URL + "/", response.getRedirectedUrl());
    }

    @Test
    @DisplayName("a non-OAuth2 login only redirects to the frontend")
    void redirectsOtherLogins() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();

        handler().onAuthenticationSuccess(new MockHttpServletRequest(), response, new TestingAuthenticationToken("admin", null));

        verifyNoInteractions(signInService);
        assertEquals(FRONTEND_URL + "/", response.getRedirectedUrl());
    }

    @Test
    @DisplayName("a taken email signs the user out and redirects to the login page")
    void rejectsTakenEmail() throws Exception {
        OAuth2AuthenticationToken authentication = oauthToken("github");
        when(signInService.signIn(eq("github"), any())).thenReturn(SignInOutcome.EMAIL_TAKEN);
        SecurityContextHolder.getContext().setAuthentication(authentication);
        MockHttpSession session = new MockHttpSession();
        MockHttpServletResponse response = new MockHttpServletResponse();

        handler().onAuthenticationSuccess(requestWith(session), response, authentication);

        assertEquals(FRONTEND_URL + "/login?error=email_exists", response.getRedirectedUrl());
        assertTrue(session.isInvalid());
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verifyNoInteractions(guestSessionAuthenticator);
    }

    @Test
    @DisplayName("a login after an upgrade request upgrades the remembered guest")
    void upgradesPendingGuest() throws Exception {
        when(signInService.signInAndUpgradeGuest(eq("google"), any(), eq("guest-sub"))).thenReturn(SignInOutcome.GUEST_UPGRADED);
        MockHttpSession session = new MockHttpSession();
        GuestUpgradeSession.remember(session, "guest-sub");
        MockHttpServletResponse response = new MockHttpServletResponse();

        handler().onAuthenticationSuccess(requestWith(session), response, oauthToken("google"));

        assertEquals(FRONTEND_URL + "/?guest_upgrade=success", response.getRedirectedUrl());
        assertNull(session.getAttribute(GuestUpgradeSession.PENDING_GUEST_ATTRIBUTE));
        verifyNoInteractions(guestSessionAuthenticator);
    }

    @Test
    @DisplayName("an upgrade blocked by a taken email returns to the guest session")
    void returnsToGuestWhenEmailTaken() throws Exception {
        when(signInService.signInAndUpgradeGuest(eq("github"), any(), eq("guest-sub"))).thenReturn(SignInOutcome.GUEST_UPGRADE_EMAIL_TAKEN);
        MockHttpSession session = new MockHttpSession();
        GuestUpgradeSession.remember(session, "guest-sub");
        MockHttpServletRequest request = requestWith(session);
        MockHttpServletResponse response = new MockHttpServletResponse();

        handler().onAuthenticationSuccess(request, response, oauthToken("github"));

        verify(guestSessionAuthenticator).restore("guest-sub", request, response);
        assertEquals(FRONTEND_URL + "/?guest_upgrade=email_exists", response.getRedirectedUrl());
    }

    @Test
    @DisplayName("a failed upgrade returns to the guest session")
    void returnsToGuestWhenUpgradeFails() throws Exception {
        when(signInService.signInAndUpgradeGuest(eq("google"), any(), eq("guest-sub"))).thenReturn(SignInOutcome.GUEST_UPGRADE_FAILED);
        MockHttpSession session = new MockHttpSession();
        GuestUpgradeSession.remember(session, "guest-sub");
        MockHttpServletRequest request = requestWith(session);
        MockHttpServletResponse response = new MockHttpServletResponse();

        handler().onAuthenticationSuccess(request, response, oauthToken("google"));

        verify(guestSessionAuthenticator).restore("guest-sub", request, response);
        assertEquals(FRONTEND_URL + "/?guest_upgrade=failed", response.getRedirectedUrl());
    }

    private OAuth2LoginSuccessHandler handler() {
        return new OAuth2LoginSuccessHandler(signInService, guestSessionAuthenticator, FRONTEND_URL);
    }

    private static OAuth2AuthenticationToken oauthToken(String registrationId) {
        DefaultOAuth2User principal = new DefaultOAuth2User(AuthorityUtils.createAuthorityList("ROLE_USER"), Map.of("sub", "abc"), "sub");
        return new OAuth2AuthenticationToken(principal, principal.getAuthorities(), registrationId);
    }

    private static MockHttpServletRequest requestWith(MockHttpSession session) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setSession(session);
        return request;
    }
}
