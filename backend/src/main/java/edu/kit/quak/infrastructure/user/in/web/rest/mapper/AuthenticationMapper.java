package edu.kit.quak.infrastructure.user.in.web.rest.mapper;

import edu.kit.quak.application.user.dto.AuthStatusResponse;
import edu.kit.quak.application.user.dto.LogoutResponse;
import edu.kit.quak.application.user.exceptions.UserNotFoundException;
import edu.kit.quak.core.user.model.AuthenticatedUser;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.infrastructure.user.in.web.rest.dto.RestAuthStatusResponse;
import edu.kit.quak.infrastructure.user.in.web.rest.dto.RestLogoutResponse;
import edu.kit.quak.infrastructure.user.in.web.security.GuestAuthenticationToken;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
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
@Slf4j
@Component
public class AuthenticationMapper {

    /**
     * Extracts domain AuthenticatedUser from Spring Security Authentication.
     *
     * @param authentication Spring Security authentication object
     * @return Domain model representing the authenticated user
     * @throws UserNotFoundException if the authentication is missing, of an unsupported type, or carries no subject
     */
    public AuthenticatedUser toDomain(Authentication authentication) {
        return switch (authentication) {
            case null -> throw new UserNotFoundException("No authentication found");
            case OAuth2AuthenticationToken oauthToken -> new AuthenticatedUser(
                null,
                oauthToken.getAuthorizedClientRegistrationId(),
                oauthSubject(oauthToken.getPrincipal())
            );
            case GuestAuthenticationToken guestToken -> new AuthenticatedUser(
                null,
                User.GUEST_ISSUER,
                guestToken.getPrincipal().toString()
            );
            // Dev mode / basic auth: the username (e.g. 'admin') is the subject
            case UsernamePasswordAuthenticationToken basicAuth -> new AuthenticatedUser(null, "local", basicAuth.getName());
            default -> throw new UserNotFoundException("Unsupported authentication type: " + authentication.getClass().getSimpleName());
        };
    }

    /** GitHub uses "id" as the unique identifier, Google (OIDC) uses "sub". */
    private String oauthSubject(OAuth2User principal) {
        Object subject = principal.getAttribute("sub");
        if (subject == null) {
            subject = principal.getAttribute("id");
        }
        if (subject == null) {
            throw new UserNotFoundException("OAuth2 user has neither a 'sub' nor an 'id' attribute");
        }
        return subject.toString();
    }

    /**
     * Extracts the domain user from the authentication if it represents a signed-in user.
     *
     * @param authentication Spring Security authentication object, may be null
     * @return The authenticated user, empty if not authenticated or not mappable
     */
    public Optional<AuthenticatedUser> toDomainIfAuthenticated(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return Optional.empty();
        }

        try {
            return Optional.of(toDomain(authentication));
        } catch (UserNotFoundException e) {
            log.warn("Authenticated user found in security context but missing in database: {}", e.getMessage());
            return Optional.empty();
        } catch (Exception e) {
            log.error("Unexpected error during authentication mapping", e);
            return Optional.empty();
        }
    }

    /**
     * Converts a user to the REST authentication status of a signed-in user.
     *
     * @param user The signed-in user
     * @return The infrastructure-layer REST response
     */
    public RestAuthStatusResponse toRestResponse(User user) {
        return new RestAuthStatusResponse(true, user.getId(), user.isGuest());
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
        boolean guest = false;
        if (response.user() != null) {
            userId = response.user().getId();
            guest = response.user().isGuest();
        }
        return new RestAuthStatusResponse(response.authenticated(), userId, guest);
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
