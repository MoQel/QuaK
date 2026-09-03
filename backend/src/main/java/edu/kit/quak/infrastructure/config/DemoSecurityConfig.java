package edu.kit.quak.infrastructure.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.SecurityContextHolderFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Security configuration for demonstrations: every visitor is signed in automatically, as their own
 * numbered account, with no login step at all. Only active under the "demo" profile.
 *
 * <p>The difference to {@link DevSecurityConfig} is the one that matters in front of an audience.
 * Basic auth needs credentials the browser never sends on its own -- {@code /api/auth/user} is
 * permitted anonymously and answers {@code authenticated: false} rather than challenging -- so the
 * app shows its login page and the OAuth buttons are the only way on. Here a filter fills the
 * security context before anything asks, so the very first request is already authenticated.
 *
 * <p>Nothing downstream had to learn about this: the token is the same
 * {@link UsernamePasswordAuthenticationToken} that basic auth produces, which
 * {@code AuthenticationMapper} already maps to issuer {@code local}, and {@link DemoGuestRegistry}
 * puts the matching row in the database.
 *
 * <p><b>This profile turns authentication off.</b> Anyone who can reach the port is signed in, and
 * separate accounts keep visitors out of each other's projects but protect nothing -- a later
 * session could be handed a name an earlier visitor used. Run it on a laptop or a closed network,
 * never on a public host, and never as the default profile.
 */
@Configuration
@EnableWebSecurity
@Profile("demo")
@Order(1) // Ahead of the OAuth2 SecurityConfig, which is disabled under this profile anyway.
public class DemoSecurityConfig {

    /** Session attribute holding the demo account this browser was assigned. */
    private static final String SESSION_ATTRIBUTE = "demoGuestSubject";

    /** The status endpoint the frontend calls before anything else, and the only account gate. */
    private static final String AUTH_STATUS_PATH = "/api/auth/user";

    private final DemoGuestRegistry guestRegistry;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public DemoSecurityConfig(DemoGuestRegistry guestRegistry) {
        this.guestRegistry = guestRegistry;
    }

    @Bean
    public SecurityFilterChain demoSecurityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(demoCorsConfigurationSource()))
            // No login means no login form to protect, and a CSRF token the SPA would have to fetch
            // first is one more thing to go wrong in front of an audience.
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth ->
                auth
                    // The one endpoint that may open an account, so it has to answer without one.
                    .requestMatchers(AUTH_STATUS_PATH)
                    .permitAll()
                    // Everything else refuses a caller with no session rather than minting an
                    // account for it -- otherwise a health check, or any client that does not keep
                    // cookies, fills the database with one row per request.
                    .requestMatchers("/api/**")
                    .authenticated()
                    .anyRequest()
                    .permitAll()
            )
            .addFilterAfter(guestAuthenticationFilter(), SecurityContextHolderFilter.class)
            // The H2 console renders in a frameset.
            .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()));

        return http.build();
    }

    /**
     * Signs every API request in as this browser session's demo account.
     *
     * <p>The identity is kept in the session rather than re-derived per request, so a visitor keeps
     * their projects for as long as their session lives. The guard leaves room for an existing
     * authentication to win, so the filter cannot quietly replace one identity with another.
     */
    private OncePerRequestFilter guestAuthenticationFilter() {
        return new OncePerRequestFilter() {
            /**
             * Only API calls. Static assets are permitted anonymously and need no identity, and
             * running them through here would be actively harmful: a page load fetches dozens at
             * once, all before the browser holds a session cookie.
             */
            @Override
            protected boolean shouldNotFilter(HttpServletRequest request) {
                return !request.getRequestURI().startsWith("/api/");
            }

            @Override
            protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
                throws ServletException, IOException {
                if (SecurityContextHolder.getContext().getAuthentication() == null) {
                    String subject = resolveSubject(request);
                    if (subject != null) {
                        SecurityContextHolder.getContext().setAuthentication(
                            new UsernamePasswordAuthenticationToken(subject, null, List.of(new SimpleGrantedAuthority("ROLE_USER")))
                        );
                    }
                }
                chain.doFilter(request, response);
            }
        };
    }

    /**
     * The account for this browser, or null when this request may not open one.
     *
     * <p>An existing session always wins. A request without one is granted an account only on the
     * status endpoint -- the call the app makes first, and the one that hands back the session
     * cookie every later request rides on. Narrowing it to that single path is what keeps the
     * account list to one entry per visitor instead of one per cookie-less request.
     */
    private String resolveSubject(HttpServletRequest request) {
        HttpSession existing = request.getSession(false);
        if (existing != null && existing.getAttribute(SESSION_ATTRIBUTE) instanceof String subject) {
            return subject;
        }

        if (!AUTH_STATUS_PATH.equals(request.getRequestURI())) {
            return null;
        }

        String subject = guestRegistry.register();
        request.getSession(true).setAttribute(SESSION_ATTRIBUTE, subject);
        return subject;
    }

    @Bean
    public CorsConfigurationSource demoCorsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Same origin when the jar serves the built frontend; the others cover `npm run dev`.
        configuration.setAllowedOrigins(List.of(frontendUrl, "http://localhost:8080", "http://localhost:5173"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
