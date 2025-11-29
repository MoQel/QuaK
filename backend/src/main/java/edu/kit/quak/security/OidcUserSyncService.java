package edu.kit.quak.security;

import edu.kit.quak.security.model.User;
import edu.kit.quak.security.repository.UserRepository;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class OidcUserSyncService {

    private final UserRepository userRepository;

    public OidcUserSyncService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public User syncUser(String issuer, OidcUser oidcUser) {
        String sub = oidcUser.getSubject();
        if (sub == null) {
            throw new IllegalArgumentException("Subject (sub) claim is missing");
        }

        return userRepository.findByIssuerAndSub(issuer, sub)
                .map(existingUser -> updateUser(existingUser, oidcUser))
                .orElseGet(() -> createUser(issuer, sub, oidcUser));
    }

    private User updateUser(User user, OidcUser oidcUser) {
        user.setEmail(oidcUser.getEmail());
        user.setEmailVerified(oidcUser.getEmailVerified());
        user.setName(oidcUser.getFullName());
        user.setGivenName(oidcUser.getGivenName());
        user.setFamilyName(oidcUser.getFamilyName());
        user.setAvatarUrl(oidcUser.getPicture());
        user.setLastLoginAt(Instant.now());
        return userRepository.save(user);
    }

    private User createUser(String issuer, String sub, OidcUser oidcUser) {
        User user = new User();
        user.setIssuer(issuer);
        user.setSub(sub);
        user.setEmail(oidcUser.getEmail());
        user.setEmailVerified(oidcUser.getEmailVerified());
        user.setName(oidcUser.getFullName());
        user.setGivenName(oidcUser.getGivenName());
        user.setFamilyName(oidcUser.getFamilyName());
        user.setAvatarUrl(oidcUser.getPicture());
        user.setLastLoginAt(Instant.now());
        return userRepository.save(user);
    }
}
