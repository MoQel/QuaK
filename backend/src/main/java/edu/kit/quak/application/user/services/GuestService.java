package edu.kit.quak.application.user.services;

import edu.kit.quak.application.common.ports.out.DomainEventPublisherPort;
import edu.kit.quak.application.user.exceptions.AlreadyAuthenticatedException;
import edu.kit.quak.application.user.exceptions.UserNotFoundException;
import edu.kit.quak.application.user.ports.in.GuestServicePort;
import edu.kit.quak.application.user.ports.in.ProjectRoleServicePort;
import edu.kit.quak.application.user.ports.in.UserServicePort;
import edu.kit.quak.application.user.ports.out.UserRepositoryPort;
import edu.kit.quak.core.user.event.GuestUpgradedEvent;
import edu.kit.quak.core.user.model.AuthenticatedUser;
import edu.kit.quak.core.user.model.User;
import java.time.Instant;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Service for creating and cleaning up guest accounts. */
@Service
@Slf4j
public class GuestService implements GuestServicePort {

    private final UserRepositoryPort userRepository;
    private final UserServicePort userService;
    private final ProjectRoleServicePort roleService;
    private final DomainEventPublisherPort eventPublisher;

    public GuestService(
        UserRepositoryPort userRepository,
        UserServicePort userService,
        ProjectRoleServicePort roleService,
        DomainEventPublisherPort eventPublisher
    ) {
        this.userRepository = userRepository;
        this.userService = userService;
        this.roleService = roleService;
        this.eventPublisher = eventPublisher;
    }

    @Override
    @Transactional
    public User createGuest(AuthenticatedUser current) {
        if (current != null) {
            throw new AlreadyAuthenticatedException("Already signed in");
        }
        User guest = userRepository.save(User.createGuest());
        log.info("Created guest user '{}'", guest.getId());
        return guest;
    }

    @Override
    @Transactional
    public void recordActivity(String subject) {
        userRepository.updateLastActiveAt(User.GUEST_ISSUER, subject, Instant.now());
    }

    @Override
    public void deleteGuest(String subject) {
        userRepository
            .findByIssuerAndSub(User.GUEST_ISSUER, subject)
            .filter(User::isGuest)
            .ifPresent(guest -> userService.deleteUser(guest.getId()));
    }

    @Override
    @Transactional
    public void upgradeGuest(String subject, UUID accountId) {
        User guest = userRepository
            .findByIssuerAndSub(User.GUEST_ISSUER, subject)
            .filter(User::isGuest)
            .orElseThrow(() -> new UserNotFoundException(User.GUEST_ISSUER, subject));
        log.info("Upgrading guest '{}' to account '{}'", guest.getId(), accountId);
        eventPublisher.publish(new GuestUpgradedEvent(guest.getId(), accountId));
        roleService.transferAllByUserId(guest.getId(), accountId);
        userService.deleteUser(guest.getId());
    }

    @Override
    public int deleteInactiveGuests(Instant inactiveSince) {
        int deleted = 0;
        for (User guest : userRepository.findInactiveGuests(inactiveSince)) {
            try {
                userService.deleteUser(guest.getId());
                deleted++;
            } catch (RuntimeException e) {
                log.error("Failed to delete inactive guest '{}'", guest.getId(), e);
            }
        }
        if (deleted > 0) {
            log.info("Deleted {} inactive guests", deleted);
        }
        return deleted;
    }
}
