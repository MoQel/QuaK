package edu.kit.quak.infrastructure.user.in.web.security;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import edu.kit.quak.application.user.ports.in.GuestServicePort;
import edu.kit.quak.shared.tags.UnitTest;
import java.time.Instant;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

@UnitTest
@ExtendWith(MockitoExtension.class)
class GuestActivityFilterTest {

    @Mock
    GuestServicePort guestService;

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("records guest activity once per interval and session")
    void recordsOncePerInterval() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(new GuestAuthenticationToken("guest-sub"));
        MockHttpSession session = new MockHttpSession();
        GuestActivityFilter filter = new GuestActivityFilter(guestService);

        filter.doFilter(requestWith(session), new MockHttpServletResponse(), new MockFilterChain());
        filter.doFilter(requestWith(session), new MockHttpServletResponse(), new MockFilterChain());

        verify(guestService, times(1)).recordActivity("guest-sub");
        assertNotNull(session.getAttribute(GuestActivityFilter.LAST_RECORDED_ATTRIBUTE));
    }

    @Test
    @DisplayName("records again once the interval has passed")
    void recordsAgainAfterInterval() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(new GuestAuthenticationToken("guest-sub"));
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(
            GuestActivityFilter.LAST_RECORDED_ATTRIBUTE,
            Instant.now().minus(GuestActivityFilter.RECORD_INTERVAL).minusSeconds(1)
        );

        new GuestActivityFilter(guestService).doFilter(requestWith(session), new MockHttpServletResponse(), new MockFilterChain());

        verify(guestService).recordActivity("guest-sub");
    }

    @Test
    @DisplayName("ignores requests of non-guest users")
    void ignoresNonGuests() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken("someone", null, "ROLE_USER"));

        new GuestActivityFilter(guestService).doFilter(
            requestWith(new MockHttpSession()),
            new MockHttpServletResponse(),
            new MockFilterChain()
        );

        verify(guestService, never()).recordActivity(anyString());
    }

    private static MockHttpServletRequest requestWith(MockHttpSession session) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setSession(session);
        return request;
    }
}
