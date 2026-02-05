package edu.kit.quak.application.user.services;

import edu.kit.quak.application.user.dto.AuthStatusResponse;
import edu.kit.quak.application.user.dto.LogoutResponse;
import edu.kit.quak.application.user.ports.in.AuthServicePort;
import edu.kit.quak.application.user.ports.out.UserRepositoryPort;
import edu.kit.quak.core.user.model.AuthenticatedUser;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service for authentication-related business logic. Handles auth status checks, user info
 * retrieval, and logout operations.
 *
 * <p>This service is framework-agnostic and works only with domain concepts. The infrastructure
 * layer (AuthRestAdapter) is responsible for extracting authentication information from the
 * framework and passing it here.
 */
@Service
@Slf4j
public class AuthService implements AuthServicePort {

    private final UserRepositoryPort userRepository;

    public AuthService(UserRepositoryPort userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public AuthStatusResponse getAuthenticationStatus(Optional<AuthenticatedUser> authenticatedUser) {
        log.debug("Checking auth status. Authenticated: {}", authenticatedUser.isPresent());

        if (authenticatedUser.isEmpty()) {
            return new AuthStatusResponse(false, null);
        }

        AuthenticatedUser domainUser = authenticatedUser.get();

        // Fetch the full User object from the database
        log.debug("Fetching full user details for issuer: {}, sub: {}", domainUser.issuer(), domainUser.subject());

        return userRepository
                .findByIssuerAndSub(domainUser.issuer(), domainUser.subject())
                .map(user -> new AuthStatusResponse(true, user))
                .orElse(new AuthStatusResponse(false, null));
    }

    @Override
    public LogoutResponse logout(String sessionId) {
        log.info("Processing logout for session: {}", sessionId);
        // Business logic for logout can be added here if needed
        // (e.g., audit logging, cleanup operations)

        return new LogoutResponse("Logged out successfully");
    }
}
