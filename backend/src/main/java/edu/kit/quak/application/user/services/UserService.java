package edu.kit.quak.application.user.services;

import edu.kit.quak.application.common.ports.out.DomainEventPublisherPort;
import edu.kit.quak.application.user.exceptions.UserNotFoundException;
import edu.kit.quak.application.user.ports.in.UserServicePort;
import edu.kit.quak.application.user.ports.out.ProjectRoleRepositoryPort;
import edu.kit.quak.application.user.ports.out.UserRepositoryPort;
import edu.kit.quak.core.user.event.UserDeletedEvent;
import edu.kit.quak.core.user.model.AuthenticatedUser;
import edu.kit.quak.core.user.model.User;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for user-related business logic. Handles user authentication,
 * authorization, and user
 * data operations.
 */
@Service
@Slf4j
public class UserService implements UserServicePort {

    private final UserRepositoryPort userRepository;
    private final ProjectRoleRepositoryPort roleRepository;
    private final DomainEventPublisherPort eventPublisher;

    public UserService(
        UserRepositoryPort userRepository,
        ProjectRoleRepositoryPort roleRepository,
        DomainEventPublisherPort eventPublisher
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.eventPublisher = eventPublisher;
    }

    @Override
    public User getAuthenticatedUser(AuthenticatedUser authenticatedUser) {
        log.debug("Fetching authenticated user details for issuer={} sub={}", authenticatedUser.issuer(), authenticatedUser.subject());
        // Look up the full user from the repository using the authenticated user's
        // issuer and subject
        return userRepository
            .findByIssuerAndSub(authenticatedUser.issuer(), authenticatedUser.subject())
            .orElseThrow(() -> {
                log.debug("User not found for issuer={} sub={}", authenticatedUser.issuer(), authenticatedUser.subject());
                return new UserNotFoundException(authenticatedUser.issuer(), authenticatedUser.subject());
            });
    }

    @Override
    public Optional<User> findById(UUID id) {
        log.debug("Finding user by ID: {}", id);
        return userRepository.findById(id);
    }

    @Override
    public Optional<User> findByIssuerAndSub(String issuer, String sub) {
        log.debug("Finding user by issuer={} sub={}", issuer, sub);
        return userRepository.findByIssuerAndSub(issuer, sub);
    }

    @Override
    public UUID getAuthenticatedUserId(AuthenticatedUser authenticatedUser) {
        log.debug("Fetching authenticated user ID for issuer={} sub={}", authenticatedUser.issuer(), authenticatedUser.subject());
        // Use the efficient query that only fetches the UUID
        return userRepository
            .findIdByIssuerAndSub(authenticatedUser.issuer(), authenticatedUser.subject())
            .orElseThrow(() -> {
                log.debug("User ID not found for issuer={} sub={}", authenticatedUser.issuer(), authenticatedUser.subject());
                return new UserNotFoundException(authenticatedUser.issuer(), authenticatedUser.subject());
            });
    }

    @Override
    public List<User> searchByEmail(String emailQuery) {
        log.debug("Searching users by email query: {}", emailQuery);
        if (emailQuery == null || emailQuery.isBlank()) {
            return List.of();
        }
        return userRepository.searchByEmail(emailQuery);
    }

    @Override
    public List<User> findAllByIds(List<UUID> ids) {
        log.debug("Finding users by IDs: {}", ids);
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return userRepository.findAllByIds(ids);
    }

    @Override
    @Transactional
    public void deleteUser(UUID id) {
        log.info("Deleting user '{}'", id);
        eventPublisher.publish(new UserDeletedEvent(id));
        roleRepository.deleteAllByUserId(id);
        userRepository.deleteById(id);
    }
}
