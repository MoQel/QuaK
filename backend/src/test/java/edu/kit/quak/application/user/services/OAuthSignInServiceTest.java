package edu.kit.quak.application.user.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import edu.kit.quak.application.user.dto.SignInOutcome;
import edu.kit.quak.application.user.exceptions.DuplicateEmailException;
import edu.kit.quak.application.user.ports.in.GuestServicePort;
import edu.kit.quak.application.user.ports.in.OidcSyncServicePort;
import edu.kit.quak.application.user.ports.in.OidcUserInfo;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.shared.tags.UnitTest;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@UnitTest
@ExtendWith(MockitoExtension.class)
class OAuthSignInServiceTest {

    private final OidcUserInfo userInfo = new OidcUserInfo("abc", "ada@example.com", true, "Ada", null, null, null);
    private final User account = new User(UUID.randomUUID(), "google", "abc");

    @Mock
    OidcSyncServicePort oidcSyncService;

    @Mock
    GuestServicePort guestService;

    @InjectMocks
    OAuthSignInService signInService;

    @Test
    @DisplayName("signs in the synced account")
    void signsIn() {
        when(oidcSyncService.syncUser("google", userInfo)).thenReturn(account);

        assertEquals(SignInOutcome.SIGNED_IN, signInService.signIn("google", userInfo));
    }

    @Test
    @DisplayName("rejects an email that belongs to another provider")
    void rejectsTakenEmail() {
        when(oidcSyncService.syncUser("google", userInfo)).thenThrow(new DuplicateEmailException("taken"));

        assertEquals(SignInOutcome.EMAIL_TAKEN, signInService.signIn("google", userInfo));
    }

    @Test
    @DisplayName("moves the guest's data to the synced account")
    void upgradesGuest() {
        when(oidcSyncService.syncUser("google", userInfo)).thenReturn(account);

        assertEquals(SignInOutcome.GUEST_UPGRADED, signInService.signInAndUpgradeGuest("google", userInfo, "guest-sub"));

        verify(guestService).upgradeGuest("guest-sub", account.getId());
    }

    @Test
    @DisplayName("keeps the guest when the email belongs to another provider")
    void keepsGuestWhenEmailTaken() {
        when(oidcSyncService.syncUser("google", userInfo)).thenThrow(new DuplicateEmailException("taken"));

        assertEquals(SignInOutcome.GUEST_UPGRADE_EMAIL_TAKEN, signInService.signInAndUpgradeGuest("google", userInfo, "guest-sub"));

        verifyNoInteractions(guestService);
    }

    @Test
    @DisplayName("keeps the guest when moving its data fails")
    void keepsGuestWhenUpgradeFails() {
        when(oidcSyncService.syncUser("google", userInfo)).thenReturn(account);
        doThrow(new IllegalStateException("boom")).when(guestService).upgradeGuest("guest-sub", account.getId());

        assertEquals(SignInOutcome.GUEST_UPGRADE_FAILED, signInService.signInAndUpgradeGuest("google", userInfo, "guest-sub"));
    }
}
