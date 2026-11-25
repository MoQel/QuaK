package edu.kit.quak.infrastructure.user.in.web.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.util.Optional;

/** Remembers in the HTTP session which guest is to be upgraded by the OAuth2 login that follows. */
public final class GuestUpgradeSession {

    static final String PENDING_GUEST_ATTRIBUTE = GuestUpgradeSession.class.getName() + ".pendingGuest";

    private GuestUpgradeSession() {}

    public static void remember(HttpSession session, String guestSubject) {
        session.setAttribute(PENDING_GUEST_ATTRIBUTE, guestSubject);
    }

    /** Returns the remembered guest subject and forgets it. */
    public static Optional<String> take(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return Optional.empty();
        }
        Object guestSubject = session.getAttribute(PENDING_GUEST_ATTRIBUTE);
        session.removeAttribute(PENDING_GUEST_ATTRIBUTE);
        return Optional.ofNullable(guestSubject).map(Object::toString);
    }
}
