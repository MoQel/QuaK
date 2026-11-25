package edu.kit.quak.application.user;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import edu.kit.quak.application.common.ports.out.DomainEventPublisherPort;
import edu.kit.quak.application.user.exceptions.AlreadyAuthenticatedException;
import edu.kit.quak.application.user.exceptions.UserNotFoundException;
import edu.kit.quak.application.user.ports.in.ProjectRoleServicePort;
import edu.kit.quak.application.user.ports.in.UserServicePort;
import edu.kit.quak.application.user.ports.out.UserRepositoryPort;
import edu.kit.quak.application.user.services.GuestService;
import edu.kit.quak.core.user.event.GuestUpgradedEvent;
import edu.kit.quak.core.user.model.AuthenticatedUser;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.shared.tags.UnitTest;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@UnitTest
@ExtendWith(MockitoExtension.class)
class GuestServiceTest {

    @Mock
    UserRepositoryPort userRepository;

    @Mock
    UserServicePort userService;

    @Mock
    ProjectRoleServicePort roleService;

    @Mock
    DomainEventPublisherPort eventPublisher;

    @InjectMocks
    GuestService guestService;

    @Test
    @DisplayName("creates and persists a guest for an unauthenticated caller")
    void createsGuest() {
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User guest = guestService.createGuest(null);

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertEquals(guest, saved.getValue());
        assertTrue(guest.isGuest());
        assertEquals(User.GUEST_ISSUER, guest.getIssuer());
    }

    @Test
    @DisplayName("rejects an already authenticated caller without creating anything")
    void rejectsAuthenticatedCaller() {
        AuthenticatedUser current = new AuthenticatedUser(UUID.randomUUID(), "github", "someone");

        assertThrows(AlreadyAuthenticatedException.class, () -> guestService.createGuest(current));

        verifyNoInteractions(userRepository);
    }

    @Test
    @DisplayName("records the activity of a guest without loading it")
    void recordsActivity() {
        Instant before = Instant.now();

        guestService.recordActivity("guest-sub");

        verify(userRepository).updateLastActiveAt(eq(User.GUEST_ISSUER), eq("guest-sub"), argThat(at -> !at.isBefore(before)));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("deletes every inactive guest and continues after a failed deletion")
    void deletesInactiveGuests() {
        Instant cutoff = Instant.now();
        User failing = guestWithId();
        User deletable = guestWithId();
        when(userRepository.findInactiveGuests(cutoff)).thenReturn(List.of(failing, deletable));
        doThrow(new IllegalStateException("boom")).when(userService).deleteUser(failing.getId());

        int deleted = guestService.deleteInactiveGuests(cutoff);

        assertEquals(1, deleted);
        verify(userService).deleteUser(deletable.getId());
    }

    private static User guestWithId() {
        User guest = User.createGuest();
        guest.setId(UUID.randomUUID());
        return guest;
    }

    @Test
    @DisplayName("deletes a guest by its subject")
    void deletesGuest() {
        User guest = guestWithId();
        when(userRepository.findByIssuerAndSub(User.GUEST_ISSUER, guest.getSub())).thenReturn(Optional.of(guest));

        guestService.deleteGuest(guest.getSub());

        verify(userService).deleteUser(guest.getId());
    }

    @Test
    @DisplayName("ignores an unknown guest subject")
    void ignoresUnknownGuest() {
        when(userRepository.findByIssuerAndSub(User.GUEST_ISSUER, "gone")).thenReturn(Optional.empty());

        guestService.deleteGuest("gone");

        verifyNoInteractions(userService);
    }

    @Test
    @DisplayName("moves the data of a guest to the account before deleting the guest")
    void upgradesGuest() {
        User guest = guestWithId();
        UUID accountId = UUID.randomUUID();
        when(userRepository.findByIssuerAndSub(User.GUEST_ISSUER, guest.getSub())).thenReturn(Optional.of(guest));

        guestService.upgradeGuest(guest.getSub(), accountId);

        InOrder order = inOrder(eventPublisher, roleService, userService);
        order.verify(eventPublisher).publish(new GuestUpgradedEvent(guest.getId(), accountId));
        order.verify(roleService).transferAllByUserId(guest.getId(), accountId);
        order.verify(userService).deleteUser(guest.getId());
    }

    @Test
    @DisplayName("refuses to upgrade an unknown guest")
    void rejectsUnknownGuestUpgrade() {
        UUID accountId = UUID.randomUUID();
        when(userRepository.findByIssuerAndSub(User.GUEST_ISSUER, "gone")).thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class, () -> guestService.upgradeGuest("gone", accountId));

        verifyNoInteractions(eventPublisher, roleService, userService);
    }
}
