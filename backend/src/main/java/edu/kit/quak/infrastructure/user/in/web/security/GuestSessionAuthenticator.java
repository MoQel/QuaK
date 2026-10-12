package edu.kit.quak.infrastructure.user.in.web.security;

import edu.kit.quak.core.user.model.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
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
        if (request.getSession(false) != null) {
            request.changeSessionId();
        }
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new GuestAuthenticationToken(guest.getSub()));
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, request, response);
    }
}
