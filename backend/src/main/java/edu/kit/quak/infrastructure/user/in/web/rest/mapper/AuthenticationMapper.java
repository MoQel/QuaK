package edu.kit.quak.infrastructure.user.in.web.rest.mapper;

import edu.kit.quak.core.user.model.AuthenticatedUser;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Component;

/**
 * Utility to convert Spring Security Authentication to domain AuthenticatedUser. This adapter
 * component handles the framework-to-domain translation.
 */
@Component
public class AuthenticationMapper {

    /**
     * Extracts domain AuthenticatedUser from Spring Security Authentication.
     *
     * @param authentication Spring Security authentication object
     * @return Domain model representing the authenticated user
     * @throws edu.kit.quak.application.user.exceptions.UserNotFoundException if authentication is
     *     not OAuth2/OIDC based
     */
    public AuthenticatedUser toDomain(Authentication authentication) {
        if (authentication == null) {
            throw new edu.kit.quak.application.user.exceptions.UserNotFoundException(
                    "No authentication found", "User is not authenticated");
        }

        if (!(authentication instanceof OAuth2AuthenticationToken oauthToken)) {
            throw new edu.kit.quak.application.user.exceptions.UserNotFoundException(
                    "Invalid authentication type", "Expected OAuth2 authentication");
        }

        if (!(authentication.getPrincipal() instanceof OidcUser oidcUser)) {
            throw new edu.kit.quak.application.user.exceptions.UserNotFoundException(
                    "Invalid principal type", "Expected OIDC user");
        }

        String issuer = oauthToken.getAuthorizedClientRegistrationId();
        String subject = oidcUser.getSubject();

        // Note: userId will be null here - it needs to be looked up from the database
        // This is done by the UserService.getAuthenticatedUser() method
        return new AuthenticatedUser(null, issuer, subject);
    }
}
