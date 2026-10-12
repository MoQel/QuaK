package edu.kit.quak.application.user;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import edu.kit.quak.application.user.exceptions.AlreadyAuthenticatedException;
import edu.kit.quak.application.user.ports.in.UserServicePort;
import edu.kit.quak.application.user.ports.out.UserRepositoryPort;
import edu.kit.quak.application.user.services.GuestService;
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
    @DisplayName("records the activity of an existing guest")
    void recordsActivity() {
        User guest = User.createGuest();
        Instant before = guest.getLastActiveAt();
        when(userRepository.findByIssuerAndSub(User.GUEST_ISSUER, guest.getSub())).thenReturn(Optional.of(guest));

        guestService.recordActivity(guest.getSub());

        verify(userRepository).save(guest);
        assertFalse(guest.getLastActiveAt().isBefore(before));
    }

    @Test
    @DisplayName("ignores activity of an unknown guest")
    void ignoresActivityOfUnknownGuest() {
        when(userRepository.findByIssuerAndSub(User.GUEST_ISSUER, "gone")).thenReturn(Optional.empty());

        guestService.recordActivity("gone");

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
}
