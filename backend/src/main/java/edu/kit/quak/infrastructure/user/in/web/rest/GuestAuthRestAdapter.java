package edu.kit.quak.infrastructure.user.in.web.rest;

import edu.kit.quak.application.user.exceptions.NotAGuestException;
import edu.kit.quak.application.user.ports.in.GuestServicePort;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.infrastructure.user.in.web.rest.dto.RestAuthStatusResponse;
import edu.kit.quak.infrastructure.user.in.web.rest.mapper.AuthenticationMapper;
import edu.kit.quak.infrastructure.user.in.web.security.GuestAuthenticationToken;
import edu.kit.quak.infrastructure.user.in.web.security.GuestSessionAuthenticator;
import edu.kit.quak.infrastructure.user.in.web.security.GuestUpgradeSession;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** REST adapter for signing in as a guest. Only available when {@code app.guest.enabled} is true. */
@RestController
@RequestMapping("/api/auth")
@ConditionalOnProperty(name = "app.guest.enabled", havingValue = "true")
@Tag(name = "Authentication", description = "Authentication and user session management endpoints")
public class GuestAuthRestAdapter {

    private final GuestServicePort guestService;
    private final AuthenticationMapper authenticationMapper;
    private final GuestSessionAuthenticator sessionAuthenticator;

    public GuestAuthRestAdapter(
        GuestServicePort guestService,
        AuthenticationMapper authenticationMapper,
        GuestSessionAuthenticator sessionAuthenticator
    ) {
        this.guestService = guestService;
        this.authenticationMapper = authenticationMapper;
        this.sessionAuthenticator = sessionAuthenticator;
    }

    @PostMapping("/guest")
    public RestAuthStatusResponse createGuest(HttpServletRequest request, HttpServletResponse response) {
        User guest = guestService.createGuest(
            authenticationMapper.toDomainIfAuthenticated(SecurityContextHolder.getContext().getAuthentication()).orElse(null)
        );
        sessionAuthenticator.signIn(guest, request, response);
        return authenticationMapper.toRestResponse(guest);
    }

    /** Marks the current guest session for an upgrade by the OAuth2 login that the client starts next. */
    @PostMapping("/guest/upgrade")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void startUpgrade(HttpServletRequest request) {
        if (!(SecurityContextHolder.getContext().getAuthentication() instanceof GuestAuthenticationToken guestToken)) {
            throw new NotAGuestException("Only guest sessions can be upgraded");
        }
        GuestUpgradeSession.remember(request.getSession(), guestToken.getPrincipal().toString());
    }
}
