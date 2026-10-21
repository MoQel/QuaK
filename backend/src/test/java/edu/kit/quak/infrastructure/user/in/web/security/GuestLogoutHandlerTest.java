package edu.kit.quak.infrastructure.user.in.web.security;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import edu.kit.quak.application.user.ports.in.GuestServicePort;
import edu.kit.quak.shared.tags.UnitTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.TestingAuthenticationToken;

@UnitTest
@ExtendWith(MockitoExtension.class)
class GuestLogoutHandlerTest {

    @Mock
    GuestServicePort guestService;

    @Test
    @DisplayName("deletes the guest whose session is logged out")
    void deletesGuest() {
        new GuestLogoutHandler(guestService).logout(
            new MockHttpServletRequest(),
            new MockHttpServletResponse(),
            new GuestAuthenticationToken("guest-sub")
        );

        verify(guestService).deleteGuest("guest-sub");
    }

    @Test
    @DisplayName("leaves other users untouched")
    void ignoresOtherUsers() {
        new GuestLogoutHandler(guestService).logout(
            new MockHttpServletRequest(),
            new MockHttpServletResponse(),
            new TestingAuthenticationToken("someone", null, "ROLE_USER")
        );

        verifyNoInteractions(guestService);
    }

    @Test
    @DisplayName("does not fail the logout when the deletion fails")
    void ignoresDeletionFailures() {
        doThrow(new IllegalStateException("boom")).when(guestService).deleteGuest("guest-sub");
        GuestLogoutHandler handler = new GuestLogoutHandler(guestService);

        assertDoesNotThrow(() ->
            handler.logout(new MockHttpServletRequest(), new MockHttpServletResponse(), new GuestAuthenticationToken("guest-sub"))
        );
    }
}
