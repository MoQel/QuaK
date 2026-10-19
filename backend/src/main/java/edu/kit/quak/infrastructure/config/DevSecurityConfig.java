package edu.kit.quak.infrastructure.config;

import edu.kit.quak.application.user.ports.in.GuestServicePort;
import edu.kit.quak.application.user.ports.in.OidcSyncServicePort;
import edu.kit.quak.infrastructure.user.in.web.security.GuestActivityFilter;
import edu.kit.quak.infrastructure.user.in.web.security.OAuth2LoginSuccessHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * Development-only security configuration. This configuration is ONLY active
 * when the "dev" profile
 * is enabled.
 *
 * <p>
 * It adds HTTP Basic authentication next to OAuth2/OIDC for easier development
 * and API testing via Swagger UI.
 *
 * <p>
 * Usage: Run with -Dspring.profiles.active=dev or set
 * SPRING_PROFILES_ACTIVE=dev
 *
 * <p>
 * Default credentials: admin / admin
 */
@Configuration
@EnableWebSecurity
@Profile("dev")
@Order(1) // Higher priority than the main SecurityConfig
public class DevSecurityConfig {

    @Value("${app.dev.username:admin}")
    private String devUsername;

    @Value("${app.dev.password:admin}")
    private String devPassword;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    private final OidcSyncServicePort oidcUserSyncService;

    public DevSecurityConfig(OidcSyncServicePort oidcUserSyncService) {
        this.oidcUserSyncService = oidcUserSyncService;
    }

    @Bean
    public SecurityFilterChain devSecurityFilterChain(
        HttpSecurity http,
        OAuth2UserEnrichmentService oAuth2UserEnrichmentService,
        GuestServicePort guestService
    ) throws Exception {
        http
            .cors(cors -> cors.configurationSource(devCorsConfigurationSource()))
            // Disable CSRF for easier API testing in development
            .csrf(csrf -> csrf.disable())
            .addFilterAfter(new GuestActivityFilter(guestService), AnonymousAuthenticationFilter.class)
            .authorizeHttpRequests(auth ->
                auth
                    .requestMatchers(
                        "/",
                        "/login/**",
                        "/oauth2/**",
                        "/error",
                        "/*.js",
                        "/*.css",
                        "/*.html",
                        "/*.ico",
                        "/*.png",
                        "/*.jpg",
                        "/*.svg",
                        "/assets/**",
                        // OpenAPI / Swagger endpoints
                        "/swagger-ui/**",
                        "/swagger-ui.html",
                        "/api-docs/**",
                        "/api-docs.yaml",
                        "/v3/api-docs/**",
                        // H2 Console for development
                        "/h2-console/**",
                        // Auth status and guest sign-in endpoints
                        "/api/auth/user",
                        "/api/auth/guest"
                    )
                    .permitAll()
                    .anyRequest()
                    .authenticated()
            )
            // Use HTTP Basic Auth AND OAuth2 for development
            .httpBasic(Customizer.withDefaults())
            .oauth2Login(oauth2 ->
                oauth2
                    .userInfoEndpoint(userInfo -> userInfo.userService(oAuth2UserEnrichmentService))
                    .successHandler(new OAuth2LoginSuccessHandler(oidcUserSyncService, frontendUrl))
            )
            // Allow frames for H2 console
            .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()));

        return http.build();
    }

    @Bean
    public UserDetailsService devUserDetailsService() {
        UserDetails devUser = User.builder()
            .username(devUsername)
            .password(passwordEncoder().encode(devPassword))
            .roles("USER", "ADMIN")
            .build();

        return new InMemoryUserDetailsManager(devUser);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource devCorsConfigurationSource() {
        return CorsConfigurations.allowingOrigins(frontendUrl, "http://localhost:8080");
    }
}
