package edu.kit.quak.infrastructure.user.in.web.security;

import edu.kit.quak.application.user.ports.in.GuestServicePort;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import org.springframework.lang.NonNull;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/** Records the activity of signed-in guests, at most once per {@link #RECORD_INTERVAL} and session. */
public class GuestActivityFilter extends OncePerRequestFilter {

    static final Duration RECORD_INTERVAL = Duration.ofMinutes(5);
    static final String LAST_RECORDED_ATTRIBUTE = GuestActivityFilter.class.getName() + ".lastRecorded";

    private final GuestServicePort guestService;

    public GuestActivityFilter(GuestServicePort guestService) {
        this.guestService = guestService;
    }

    @Override
    protected void doFilterInternal(
        @NonNull HttpServletRequest request,
        @NonNull HttpServletResponse response,
        @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        if (SecurityContextHolder.getContext().getAuthentication() instanceof GuestAuthenticationToken guestToken) {
            recordActivity(guestToken, request.getSession(false));
        }
        filterChain.doFilter(request, response);
    }

    private void recordActivity(GuestAuthenticationToken guestToken, HttpSession session) {
        if (session == null) {
            return;
        }
        Instant now = Instant.now();
        Instant lastRecorded = (Instant) session.getAttribute(LAST_RECORDED_ATTRIBUTE);
        if (lastRecorded != null && lastRecorded.plus(RECORD_INTERVAL).isAfter(now)) {
            return;
        }
        guestService.recordActivity(guestToken.getPrincipal().toString());
        session.setAttribute(LAST_RECORDED_ATTRIBUTE, now);
    }
}
