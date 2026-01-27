package edu.kit.quak.infrastructure.user.in.web.rest.mapper;

import edu.kit.quak.application.user.dto.AuthStatusResponse;
import edu.kit.quak.application.user.dto.LogoutResponse;
import edu.kit.quak.core.user.model.AuthenticatedUser;
import edu.kit.quak.infrastructure.user.in.web.rest.dto.RestAuthStatusResponse;
import edu.kit.quak.infrastructure.user.in.web.rest.dto.RestLogoutResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;

/**
 * Utility to convert between Spring Security, domain models, and REST DTOs.
 * This adapter handles
 * the framework-to-domain and domain-to-infrastructure translations for
 * authentication.
 */
@Component
public class AuthenticationMapper {

    /**
     * Extracts domain AuthenticatedUser from Spring Security Authentication.
     *
     * @param authentication Spring Security authentication object
     * @return Domain model representing the authenticated user
     * @throws edu.kit.quak.application.user.exceptions.UserNotFoundException if
     *                                                                        authentication
     *                                                                        is
     *                                                                        not
     *                                                                        OAuth2/OIDC
     *                                                                        based
     */
    public AuthenticatedUser toDomain(Authentication authentication) {
        if (authentication == null) {
            throw new edu.kit.quak.application.user.exceptions.UserNotFoundException(
                    "No authentication found", "User is not authenticated");
        }

        if (authentication instanceof OAuth2AuthenticationToken oauthToken) {
            OAuth2User principal = oauthToken.getPrincipal();
            String issuer = oauthToken.getAuthorizedClientRegistrationId();

            // GitHub uses "id" as the unique identifier, Google (OIDC) uses "sub"
            Object subAttr = principal.getAttribute("sub");
            String subject = subAttr != null
                    ? subAttr.toString()
                    : principal.getAttribute("id").toString();

            return new AuthenticatedUser(null, issuer, subject);
        }

        // Handle Dev Mode / Basic Auth
        if (authentication
                instanceof org.springframework.security.authentication.UsernamePasswordAuthenticationToken basicAuth) {
            String issuer = "local";
            String subject = basicAuth.getName(); // the username (e.g., 'admin')
            return new AuthenticatedUser(null, issuer, subject);
        }

        throw new edu.kit.quak.application.user.exceptions.UserNotFoundException(
                "Invalid authentication type", "Expected OAuth2 or Basic authentication");
    }

    /**
     * Converts application AuthStatusResponse to infrastructure
     * RestAuthStatusResponse.
     *
     * @param response The application-layer response
     * @return The infrastructure-layer REST response
     */
    public RestAuthStatusResponse toRestResponse(AuthStatusResponse response) {
        java.util.UUID userId = null;
        if (response.user() != null) {
            userId = response.user().getId();
        }
        return new RestAuthStatusResponse(response.authenticated(), userId);
    }

    /**
     * Converts application LogoutResponse to infrastructure RestLogoutResponse.
     *
     * @param response The application-layer response
     * @return The infrastructure-layer REST response
     */
    public RestLogoutResponse toRestResponse(LogoutResponse response) {
        return new RestLogoutResponse(response.message());
    }
}
