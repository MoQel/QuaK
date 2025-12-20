package edu.kit.quak.application.user.ports.in;

import edu.kit.quak.core.user.model.User;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

/**
 * Input port for OIDC user synchronization.
 */
public interface OidcSyncServicePort {
    User syncUser(String issuer, OidcUser oidcUser);
}
