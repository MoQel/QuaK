package edu.kit.quak.application.user.services;

import edu.kit.quak.application.user.ports.in.UserServicePort;
import edu.kit.quak.application.user.ports.out.UserRepositoryPort;
import edu.kit.quak.core.user.model.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

/**
 * Service for user-related business logic.
 * Handles user authentication, authorization, and user data operations.
 */
@Service("newUserService")
public class UserService implements UserServicePort {

    private final UserRepositoryPort userRepository;

    public UserService(UserRepositoryPort userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public User getAuthenticatedUser(Authentication authentication) {
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OidcUser oidcUser = (OidcUser) authentication.getPrincipal();
        
        String registrationId = oauthToken.getAuthorizedClientRegistrationId();
        String sub = oidcUser.getSubject();
        
        return userRepository.findByIssuerAndSub(registrationId, sub)
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "User not found in database"));
    }

    @Override
    public Optional<User> findById(UUID id) {
        return userRepository.findById(id);
    }

    @Override
    public Optional<User> findByIssuerAndSub(String issuer, String sub) {
        return userRepository.findByIssuerAndSub(issuer, sub);
    }
}
