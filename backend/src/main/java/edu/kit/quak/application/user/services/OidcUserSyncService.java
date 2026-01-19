package edu.kit.quak.application.user.services;

import edu.kit.quak.application.user.ports.in.OidcSyncServicePort;
import edu.kit.quak.application.user.ports.out.UserRepositoryPort;
import edu.kit.quak.core.user.model.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for synchronizing OIDC user information with the database. This service is called after
 * successful OAuth2 login to ensure user data is up-to-date.
 */
@Service
@Slf4j
public class OidcUserSyncService implements OidcSyncServicePort {

    private final UserRepositoryPort userRepository;

    public OidcUserSyncService(UserRepositoryPort userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public User syncUser(String issuer, OidcUser oidcUser) {
        String sub = oidcUser.getSubject();
        if (sub == null) {
            log.error("Subject (sub) claim is missing in OIDC user data for issuer '{}'", issuer);
            throw new IllegalArgumentException("Subject (sub) claim is missing");
        }

        log.debug("Syncing user for issuer='{}' sub='{}'", issuer, sub);

        return userRepository
                .findByIssuerAndSub(issuer, sub)
                .map(existingUser -> updateUser(existingUser, oidcUser))
                .orElseGet(() -> createUser(issuer, sub, oidcUser));
    }

    private User updateUser(User user, OidcUser oidcUser) {
        log.info("Updating existing user '{}' from OIDC data", user.getId());
        user.updateFromOidc(
                oidcUser.getEmail(),
                oidcUser.getEmailVerified(),
                oidcUser.getFullName(),
                oidcUser.getGivenName(),
                oidcUser.getFamilyName(),
                oidcUser.getPicture());
        return userRepository.save(user);
    }

    private User createUser(String issuer, String sub, OidcUser oidcUser) {
        log.info("Creating new user for issuer='{}' sub='{}'", issuer, sub);
        User user =
                User.createFromOidc(
                        issuer,
                        sub,
                        oidcUser.getEmail(),
                        oidcUser.getEmailVerified(),
                        oidcUser.getFullName(),
                        oidcUser.getGivenName(),
                        oidcUser.getFamilyName(),
                        oidcUser.getPicture());
        return userRepository.save(user);
    }
}
