package edu.kit.quak.infrastructure.config;

import java.util.List;
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
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Development-only security configuration. This configuration is ONLY active when the "dev" profile
 * is enabled.
 *
 * <p>It replaces OAuth2/OIDC with simple HTTP Basic authentication for easier development and API
 * testing via Swagger UI.
 *
 * <p>Usage: Run with -Dspring.profiles.active=dev or set SPRING_PROFILES_ACTIVE=dev
 *
 * <p>Default credentials: admin / admin
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

    @Bean
    public SecurityFilterChain devSecurityFilterChain(HttpSecurity http) throws Exception {
        http.cors(cors -> cors.configurationSource(devCorsConfigurationSource()))
                // Disable CSRF for easier API testing in development
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(
                        auth ->
                                auth.requestMatchers(
                                                "/",
                                                "/error",
                                                "/*.js",
                                                "/*.css",
                                                "/*.html",
                                                "/*.ico",
                                                "/*.png",
                                                "/*.jpg",
                                                "/assets/**",
                                                // OpenAPI / Swagger endpoints
                                                "/swagger-ui/**",
                                                "/swagger-ui.html",
                                                "/api-docs/**",
                                                "/api-docs.yaml",
                                                "/v3/api-docs/**",
                                                // H2 Console for development
                                                "/h2-console/**",
                                                // Auth status endpoint
                                                "/api/auth/status")
                                        .permitAll()
                                        .anyRequest()
                                        .authenticated())
                // Use HTTP Basic Auth instead of OAuth2 for development
                .httpBasic(Customizer.withDefaults())
                // Allow frames for H2 console
                .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()));

        return http.build();
    }

    @Bean
    public UserDetailsService devUserDetailsService() {
        UserDetails devUser =
                User.builder()
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
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(frontendUrl, "http://localhost:8080"));
        configuration.setAllowedMethods(
                List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
