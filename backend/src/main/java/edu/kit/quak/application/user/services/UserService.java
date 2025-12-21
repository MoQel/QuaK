package edu.kit.quak.application.user.services;

import edu.kit.quak.application.user.exceptions.UserNotFoundException;
import edu.kit.quak.application.user.ports.in.UserServicePort;
import edu.kit.quak.application.user.ports.out.UserRepositoryPort;
import edu.kit.quak.core.user.model.AuthenticatedUser;
import edu.kit.quak.core.user.model.User;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

/**
 * Service for user-related business logic.
 * Handles user authentication, authorization, and user data operations.
 */
@Service
public class UserService implements UserServicePort {

    private final UserRepositoryPort userRepository;

    public UserService(UserRepositoryPort userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public User getAuthenticatedUser(AuthenticatedUser authenticatedUser) {
        // Look up the full user from the repository using the authenticated user's
        // issuer and subject
        return userRepository.findByIssuerAndSub(authenticatedUser.issuer(), authenticatedUser.subject())
                .orElseThrow(() -> new UserNotFoundException(
                        authenticatedUser.issuer(), authenticatedUser.subject()));
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
