package edu.kit.quak.infrastructure.config;

import edu.kit.quak.application.user.ports.in.GuestServicePort;
import edu.kit.quak.infrastructure.user.in.web.security.GuestLogoutHandler;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.LogoutConfigurer;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;

/** Logout settings shared by the OAuth2 security profiles. */
final class LogoutConfigurations {

    private LogoutConfigurations() {}

    /** Logs out via {@code POST /api/auth/logout}, deletes guest accounts and answers with 200 instead of a redirect. */
    static Customizer<LogoutConfigurer<HttpSecurity>> apiLogout(GuestServicePort guestService) {
        return logout ->
            logout
                .logoutUrl("/api/auth/logout")
                .addLogoutHandler(new GuestLogoutHandler(guestService))
                .logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler())
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
                .permitAll();
    }
}
