package edu.kit.quak.infrastructure.user.in.web.security;

import edu.kit.quak.application.user.exceptions.DuplicateEmailException;
import edu.kit.quak.application.user.ports.in.OidcSyncServicePort;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;

/** Syncs the signed-in OAuth2 user into the database and redirects to the frontend. */
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final OidcSyncServicePort oidcSyncService;
    private final String frontendUrl;
    private final SimpleUrlAuthenticationSuccessHandler redirect = new SimpleUrlAuthenticationSuccessHandler();
    private final SecurityContextLogoutHandler logout = new SecurityContextLogoutHandler();

    public OAuth2LoginSuccessHandler(OidcSyncServicePort oidcSyncService, String frontendUrl) {
        this.oidcSyncService = oidcSyncService;
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
        if (authentication instanceof OAuth2AuthenticationToken oauthToken) {
            try {
                oidcSyncService.syncUser(
                    oauthToken.getAuthorizedClientRegistrationId(),
                    OAuth2UserInfoMapper.toUserInfo(oauthToken.getPrincipal())
                );
            } catch (DuplicateEmailException e) {
                logout.logout(request, response, authentication);
                response.sendRedirect(frontendUrl + "/login?error=email_exists");
                return;
            }
        }
        redirect.onAuthenticationSuccess(request, response, authentication);
    }
}
