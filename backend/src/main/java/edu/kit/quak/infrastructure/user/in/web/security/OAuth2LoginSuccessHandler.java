package edu.kit.quak.infrastructure.user.in.web.security;

import edu.kit.quak.application.user.dto.SignInOutcome;
import edu.kit.quak.application.user.ports.in.OAuthSignInServicePort;
import edu.kit.quak.application.user.ports.in.OidcUserInfo;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Optional;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;

/** Passes an OAuth2 login to the sign-in use case and turns its outcome into the session and redirect. */
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final OAuthSignInServicePort signInService;
    private final GuestSessionAuthenticator guestSessionAuthenticator;
    private final String frontendUrl;
    private final SimpleUrlAuthenticationSuccessHandler redirect = new SimpleUrlAuthenticationSuccessHandler();
    private final SecurityContextLogoutHandler logout = new SecurityContextLogoutHandler();

    public OAuth2LoginSuccessHandler(
        OAuthSignInServicePort signInService,
        GuestSessionAuthenticator guestSessionAuthenticator,
        String frontendUrl
    ) {
        this.signInService = signInService;
        this.guestSessionAuthenticator = guestSessionAuthenticator;
        this.frontendUrl = frontendUrl;
        redirect.setDefaultTargetUrl(frontendUrl + "/");
        redirect.setAlwaysUseDefaultTargetUrl(true);
    }

    @Override
    public void onAuthenticationSuccess(
        @NonNull HttpServletRequest request,
        @NonNull HttpServletResponse response,
        @NonNull Authentication authentication
    ) throws IOException, ServletException {
        if (!(authentication instanceof OAuth2AuthenticationToken oauthToken)) {
            redirect.onAuthenticationSuccess(request, response, authentication);
            return;
        }
        String issuer = oauthToken.getAuthorizedClientRegistrationId();
        OidcUserInfo userInfo = OAuth2UserInfoMapper.toUserInfo(oauthToken.getPrincipal());
        Optional<String> pendingGuest = GuestUpgradeSession.take(request);
        SignInOutcome outcome = pendingGuest
            .map(guestSubject -> signInService.signInAndUpgradeGuest(issuer, userInfo, guestSubject))
            .orElseGet(() -> signInService.signIn(issuer, userInfo));

        switch (outcome) {
            case SIGNED_IN -> redirect.onAuthenticationSuccess(request, response, authentication);
            case EMAIL_TAKEN -> {
                logout.logout(request, response, authentication);
                response.sendRedirect(frontendUrl + "/login?error=email_exists");
            }
            case GUEST_UPGRADED -> response.sendRedirect(frontendUrl + "/?guest_upgrade=success");
            case GUEST_UPGRADE_EMAIL_TAKEN -> returnToGuestSession(
                request,
                response,
                authentication,
                pendingGuest.orElseThrow(),
                "email_exists"
            );
            case GUEST_UPGRADE_FAILED -> returnToGuestSession(request, response, authentication, pendingGuest.orElseThrow(), "failed");
        }
    }

    private void returnToGuestSession(
        HttpServletRequest request,
        HttpServletResponse response,
        Authentication authentication,
        String guestSubject,
        String result
    ) throws IOException {
        logout.logout(request, response, authentication);
        guestSessionAuthenticator.restore(guestSubject, request, response);
        response.sendRedirect(frontendUrl + "/?guest_upgrade=" + result);
    }
}
