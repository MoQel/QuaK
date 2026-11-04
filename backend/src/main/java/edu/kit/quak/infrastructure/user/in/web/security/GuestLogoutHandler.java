package edu.kit.quak.infrastructure.user.in.web.security;

import edu.kit.quak.application.user.ports.in.GuestServicePort;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.LogoutHandler;

/** Deletes a guest account when its session is logged out, since nobody can reach it afterwards. */
@Slf4j
public class GuestLogoutHandler implements LogoutHandler {

    private final GuestServicePort guestService;

    public GuestLogoutHandler(GuestServicePort guestService) {
        this.guestService = guestService;
    }

    @Override
    public void logout(HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
        if (authentication instanceof GuestAuthenticationToken guestToken) {
            try {
                guestService.deleteGuest(guestToken.getPrincipal().toString());
            } catch (RuntimeException e) {
                log.warn("Failed to delete guest '{}' on logout", guestToken.getPrincipal(), e);
            }
        }
    }
}
