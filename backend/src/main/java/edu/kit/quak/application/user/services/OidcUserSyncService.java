package edu.kit.quak.application.user.services;

import edu.kit.quak.application.user.exceptions.DuplicateEmailException;
import edu.kit.quak.application.user.ports.in.OidcSyncServicePort;
import edu.kit.quak.application.user.ports.in.OidcUserInfo;
import edu.kit.quak.application.user.ports.out.UserRepositoryPort;
import edu.kit.quak.core.user.model.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for synchronizing OIDC user information with the database. This
 * service is called after
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
    public User syncUser(String issuer, OidcUserInfo userInfo) {
        String sub = userInfo.sub();
        if (sub == null) {
            log.error("Subject (sub) claim is missing in OIDC user data for issuer '{}'", issuer);
            throw new IllegalStateException("Subject (sub) claim is missing");
        }

        log.debug("Syncing user for issuer='{}' sub='{}'", issuer, sub);

        return userRepository
            .findByIssuerAndSub(issuer, sub)
            .map(existingUser -> updateUser(existingUser, userInfo))
            .orElseGet(() -> {
                if (userInfo.email() != null && !userInfo.email().isBlank()) {
                    userRepository
                        .findByEmail(userInfo.email())
                        .ifPresent(existing -> {
                            log.error("Prevented login: Email '{}' is already associated with a different provider", userInfo.email());
                            throw new DuplicateEmailException("Email is already associated with a different provider");
                        });
                }
                return createUser(issuer, sub, userInfo);
            });
    }

    private User updateUser(User user, OidcUserInfo userInfo) {
        log.info("Updating existing user '{}' from OIDC data", user.getId());
        user.updateFromOidc(
            userInfo.email(),
            userInfo.emailVerified(),
            userInfo.fullName(),
            userInfo.givenName(),
            userInfo.familyName(),
            userInfo.picture()
        );
        return userRepository.save(user);
    }

    private User createUser(String issuer, String sub, OidcUserInfo userInfo) {
        log.info("Creating new user for issuer='{}' sub='{}'", issuer, sub);
        User user = User.createFromOidc(
            issuer,
            sub,
            userInfo.email(),
            userInfo.emailVerified(),
            userInfo.fullName(),
            userInfo.givenName(),
            userInfo.familyName(),
            userInfo.picture()
        );
        return userRepository.save(user);
    }
}
