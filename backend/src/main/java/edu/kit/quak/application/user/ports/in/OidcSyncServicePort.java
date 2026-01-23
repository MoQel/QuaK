package edu.kit.quak.application.user.ports.in;

import edu.kit.quak.core.user.model.User;

/** Input port for OIDC user synchronization. */
public interface OidcSyncServicePort {
    User syncUser(String issuer, OidcUserInfo userInfo);
}
