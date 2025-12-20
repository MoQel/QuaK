package edu.kit.quak.application.user.services;

import edu.kit.quak.application.user.ports.in.UserServicePort;
import edu.kit.quak.application.user.ports.out.UserRepositoryPort;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.core.filesystem.model.FileElement;
import edu.kit.quak.core.filesystem.model.Project;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

/**
 * Service for user-related business logic.
 * Handles user authentication, authorization, and user data operations.
 */
@Service("newUserService")
public class UserService implements UserServicePort {

    private final UserRepositoryPort userRepository;

    public UserService(UserRepositoryPort userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public User getAuthenticatedUser(Authentication authentication) {
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OidcUser oidcUser = (OidcUser) authentication.getPrincipal();
        
        String registrationId = oauthToken.getAuthorizedClientRegistrationId();
        String sub = oidcUser.getSubject();
        
        return userRepository.findByIssuerAndSub(registrationId, sub)
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "User not found in database"));
    }

    @Override
    public Optional<User> findById(UUID id) {
        return userRepository.findById(id);
    }

    @Override
    public Optional<User> findByIssuerAndSub(String issuer, String sub) {
        return userRepository.findByIssuerAndSub(issuer, sub);
    }

    /**
     * Verifies that the given user owns the file element (or its parent project).
     * This is the central place for ownership validation logic.
     *
     * @param element The file element to check ownership for
     * @param user The user to verify ownership against
     * @throws ResponseStatusException with 403 FORBIDDEN if the user does not own the element
     */
    public void verifyOwnership(FileElement<?> element, User user) {
        Project project = element.findProject()
                .orElseThrow(() -> new ResponseStatusException(FORBIDDEN, 
                    "Access denied: Element is not associated with a project"));
        verifyProjectOwnership(project, user);
    }

    /**
     * Verifies that the given user owns the project.
     *
     * @param project The project to check ownership for
     * @param user The user to verify ownership against
     * @throws ResponseStatusException with 403 FORBIDDEN if the user does not own the project
     */
    public void verifyProjectOwnership(Project project, User user) {
        if (project.getOwner() == null || !project.getOwner().getId().equals(user.getId())) {
            throw new ResponseStatusException(FORBIDDEN, 
                "Access denied: You do not have permission to access this resource");
        }
    }
}
