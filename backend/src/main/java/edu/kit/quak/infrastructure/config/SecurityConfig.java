package edu.kit.quak.infrastructure.config;

import edu.kit.quak.application.user.ports.in.GuestServicePort;
import edu.kit.quak.application.user.ports.in.OAuthSignInServicePort;
import edu.kit.quak.infrastructure.user.in.web.security.GuestActivityFilter;
import edu.kit.quak.infrastructure.user.in.web.security.GuestSessionAuthenticator;
import edu.kit.quak.infrastructure.user.in.web.security.OAuth2LoginSuccessHandler;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Security configuration for the application. Configures OAuth2/OIDC
 * authentication, CORS, CSRF,
 * and authorization rules.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@Profile("!dev & !local") // OAuth security is not active in development or trusted local mode
public class SecurityConfig {

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Bean
    public SecurityFilterChain securityFilterChain(
        HttpSecurity http,
        OAuth2AuthorizationRequestResolver authorizationRequestResolver,
        OAuthSignInServicePort signInService,
        OAuth2UserEnrichmentService oAuth2UserEnrichmentService,
        GuestServicePort guestService,
        GuestSessionAuthenticator guestSessionAuthenticator
    ) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf ->
                csrf
                    .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                    .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
                    .ignoringRequestMatchers("/api/auth/**", "/login/**", "/oauth2/**")
            )
            .addFilterAfter(new CsrfCookieFilter(), BasicAuthenticationFilter.class)
            .addFilterAfter(new GuestActivityFilter(guestService), AnonymousAuthenticationFilter.class)
            .authorizeHttpRequests(auth ->
                auth
                    .requestMatchers(
                        "/",
                        "/project/**",
                        "/profile",
                        "/settings",
                        "/login/**",
                        "/oauth2/**",
                        "/api/auth/user",
                        "/api/auth/guest",
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
                        "/v3/api-docs/**"
                    )
                    .permitAll()
                    .anyRequest()
                    .authenticated()
            )
            .oauth2Login(oauth2 ->
                oauth2
                    .authorizationEndpoint(authorization -> authorization.authorizationRequestResolver(authorizationRequestResolver))
                    .userInfoEndpoint(userInfo -> userInfo.userService(oAuth2UserEnrichmentService))
                    .successHandler(new OAuth2LoginSuccessHandler(signInService, guestSessionAuthenticator, frontendUrl))
            )
            .logout(LogoutConfigurations.apiLogout(guestService))
            .exceptionHandling(exception ->
                exception
                    .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
                    .accessDeniedHandler((request, response, accessDeniedException) -> {
                        response.setStatus(HttpStatus.FORBIDDEN.value());
                        response.setContentType("application/json");
                        response
                            .getWriter()
                            .write("{\"error\":\"Access" + " Denied\",\"message\":\"" + accessDeniedException.getMessage() + "\"}");
                    })
            );

        return http.build();
    }

    @Bean
    public OAuth2AuthorizationRequestResolver authorizationRequestResolver(ClientRegistrationRepository clientRegistrationRepository) {
        DefaultOAuth2AuthorizationRequestResolver defaultResolver = new DefaultOAuth2AuthorizationRequestResolver(
            clientRegistrationRepository,
            "/oauth2/authorization"
        );

        return new OAuth2AuthorizationRequestResolver() {
            @Override
            public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
                OAuth2AuthorizationRequest authorizationRequest = defaultResolver.resolve(request);
                return authorizationRequest != null ? customizeAuthorizationRequest(authorizationRequest, null) : null;
            }

            @Override
            public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
                OAuth2AuthorizationRequest authorizationRequest = defaultResolver.resolve(request, clientRegistrationId);
                return authorizationRequest != null ? customizeAuthorizationRequest(authorizationRequest, clientRegistrationId) : null;
            }
        };
    }

    private OAuth2AuthorizationRequest customizeAuthorizationRequest(
        OAuth2AuthorizationRequest authorizationRequest,
        String registrationId
    ) {
        // Generate PKCE code verifier and challenge
        String codeVerifier = generateCodeVerifier();
        String codeChallenge = generateCodeChallenge(codeVerifier);

        return OAuth2AuthorizationRequest.from(authorizationRequest)
            .additionalParameters(params -> {
                params.put("code_challenge", codeChallenge);
                params.put("code_challenge_method", "S256");
                // Only add prompt=select_account for Google to avoid issues with other
                // providers
                if ("google".equalsIgnoreCase(registrationId)) {
                    params.put("prompt", "select_account");
                }
            })
            .attributes(attrs -> attrs.put("code_verifier", codeVerifier))
            .build();
    }

    private String generateCodeVerifier() {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(UUID.randomUUID().toString().getBytes());
    }

    private String generateCodeChallenge(String codeVerifier) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(codeVerifier.getBytes());
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Failed to generate code challenge", e);
        }
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        return CorsConfigurations.allowingOrigins(frontendUrl);
    }

    private static class CsrfCookieFilter extends OncePerRequestFilter {

        @Override
        protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
        ) throws ServletException, IOException {
            CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
            if (csrfToken != null) {
                csrfToken.getToken();
            }
            filterChain.doFilter(request, response);
        }
    }
}
