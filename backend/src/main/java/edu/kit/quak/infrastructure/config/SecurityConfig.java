package edu.kit.quak.infrastructure.config;

import edu.kit.quak.application.user.ports.in.OidcSyncServicePort;
import edu.kit.quak.application.user.ports.in.OidcUserInfo;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Security configuration for the application. Configures OAuth2/OIDC
 * authentication, CORS, CSRF,
 * and authorization rules.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@Profile("!dev") // This config is NOT active when 'dev' profile is enabled
public class SecurityConfig {

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Bean
    public SecurityFilterChain securityFilterChain(
        HttpSecurity http,
        OAuth2AuthorizationRequestResolver authorizationRequestResolver,
        AuthenticationSuccessHandler authenticationSuccessHandler,
        OAuth2UserEnrichmentService oAuth2UserEnrichmentService
    ) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf ->
                csrf
                    .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                    .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
                    .ignoringRequestMatchers("/login/**", "/oauth2/**")
            )
            .addFilterAfter(new CsrfCookieFilter(), BasicAuthenticationFilter.class)
            .authorizeHttpRequests(auth ->
                auth
                    .requestMatchers(
                        "/",
                        "/login/**",
                        "/oauth2/**",
                        "/api/auth/user",
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
                    .successHandler(authenticationSuccessHandler)
            )
            .logout(logout ->
                logout
                    .logoutUrl("/api/auth/logout")
                    .logoutSuccessHandler((request, response, authentication) -> {
                        response.setStatus(jakarta.servlet.http.HttpServletResponse.SC_OK);
                    })
                    .invalidateHttpSession(true)
                    .deleteCookies("JSESSIONID")
                    .permitAll()
            )
            .exceptionHandling(exception ->
                exception
                    .authenticationEntryPoint(
                        new org.springframework.security.web.authentication.HttpStatusEntryPoint(
                            org.springframework.http.HttpStatus.UNAUTHORIZED
                        )
                    )
                    .accessDeniedHandler((request, response, accessDeniedException) -> {
                        response.setStatus(org.springframework.http.HttpStatus.FORBIDDEN.value());
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
            public OAuth2AuthorizationRequest resolve(jakarta.servlet.http.HttpServletRequest request) {
                OAuth2AuthorizationRequest authorizationRequest = defaultResolver.resolve(request);
                return authorizationRequest != null ? customizeAuthorizationRequest(authorizationRequest, null) : null;
            }

            @Override
            public OAuth2AuthorizationRequest resolve(jakarta.servlet.http.HttpServletRequest request, String clientRegistrationId) {
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
            .attributes(attrs -> {
                attrs.put("code_verifier", codeVerifier);
            })
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
            throw new RuntimeException("Failed to generate code challenge", e);
        }
    }

    @Bean
    public AuthenticationSuccessHandler authenticationSuccessHandler(OidcSyncServicePort oidcUserSyncService) {
        SimpleUrlAuthenticationSuccessHandler delegate = new SimpleUrlAuthenticationSuccessHandler();
        delegate.setDefaultTargetUrl(frontendUrl + "/");
        delegate.setAlwaysUseDefaultTargetUrl(true);

        return (request, response, authentication) -> {
            if (authentication instanceof OAuth2AuthenticationToken oauthToken) {
                OAuth2User principal = oauthToken.getPrincipal();
                String registrationId = oauthToken.getAuthorizedClientRegistrationId();

                // Map attributes dynamically based on provider
                OidcUserInfo userInfo = mapToUserInfo(principal);

                try {
                    edu.kit.quak.core.user.model.User user = oidcUserSyncService.syncUser(registrationId, userInfo);
                    request.getSession().setAttribute("userId", user.getId());
                } catch (IllegalArgumentException e) {
                    org.springframework.security.core.context.SecurityContextHolder.clearContext();
                    response.sendRedirect(frontendUrl + "/login?error=email_exists");
                    return;
                }
            }
            delegate.onAuthenticationSuccess(request, response, authentication);
        };
    }

    private OidcUserInfo mapToUserInfo(OAuth2User principal) {
        String sub =
            principal.getAttribute("sub") != null
                ? principal.getAttribute("sub").toString()
                : (principal.getAttribute("id") != null ? principal.getAttribute("id").toString() : null);

        Boolean emailVerified =
            principal.getAttribute("email_verified") != null ? (Boolean) principal.getAttribute("email_verified") : true;

        String picture =
            principal.getAttribute("picture") != null
                ? principal.getAttribute("picture").toString()
                : (principal.getAttribute("avatar_url") != null ? principal.getAttribute("avatar_url").toString() : null);

        // Logic to handle different attribute names across providers
        return new OidcUserInfo(
            sub,
            principal.getAttribute("email"),
            emailVerified,
            principal.getAttribute("name"),
            principal.getAttribute("given_name"),
            principal.getAttribute("family_name"),
            picture
        );
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(frontendUrl));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    private static class CsrfCookieFilter extends OncePerRequestFilter {

        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
            CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
            if (csrfToken != null) {
                csrfToken.getToken();
            }
            filterChain.doFilter(request, response);
        }
    }
}
