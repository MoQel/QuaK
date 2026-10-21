package edu.kit.quak.infrastructure.user.in.web.security;

import edu.kit.quak.core.user.model.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Instant;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Component;

/** Signs a guest into the current HTTP session. */
@Component
public class GuestSessionAuthenticator {

    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();

    public void signIn(User guest, HttpServletRequest request, HttpServletResponse response) {
        signIn(guest.getSub(), guest.getLastActiveAt(), request, response);
    }

    /** Signs an existing guest back in, e.g. after its upgrade to a real account failed. */
    public void restore(String guestSubject, HttpServletRequest request, HttpServletResponse response) {
        signIn(guestSubject, Instant.now(), request, response);
    }

    private void signIn(String guestSubject, Instant lastActiveAt, HttpServletRequest request, HttpServletResponse response) {
        if (request.getSession(false) != null) {
            request.changeSessionId();
        }
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new GuestAuthenticationToken(guestSubject));
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, request, response);
        request.getSession().setAttribute(GuestActivityFilter.LAST_RECORDED_ATTRIBUTE, lastActiveAt);
    }
}
