package edu.kit.quak.infrastructure.user.in.web.security;

import java.util.List;
import java.util.Objects;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

/** Authentication of a guest account, identified by its generated subject. */
public class GuestAuthenticationToken extends AbstractAuthenticationToken {

    private final String subject;

    public GuestAuthenticationToken(String subject) {
        super(List.of(new SimpleGrantedAuthority("ROLE_USER")));
        this.subject = subject;
        setAuthenticated(true);
    }

    @Override
    public Object getCredentials() {
        return null;
    }

    @Override
    public Object getPrincipal() {
        return subject;
    }

    @Override
    public boolean equals(Object other) {
        return other instanceof GuestAuthenticationToken token && super.equals(token) && subject.equals(token.subject);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), subject);
    }
}
