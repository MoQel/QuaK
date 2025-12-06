package edu.kit.quak.application.filesystem.service;

import edu.kit.quak.core.filesystem.model.FileElement;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.core.filesystem.model.User;
import edu.kit.quak.security.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

/**
 * Service for user-related business logic.
 * Handles user authentication, authorization, and user data operations.
 *
 * @author QuaK Team
 */
@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Extracts and retrieves the authenticated user from the Spring Security context.
     * Should only be called from endpoints that are protected by @PreAuthorize("isAuthenticated()").
     *
     * @param authentication The Spring Security authentication object (guaranteed to be authenticated by @PreAuthorize)
     * @return The authenticated user from the database
     * @throws ResponseStatusException with 401 UNAUTHORIZED if the user is not found in database
     */
    public User getAuthenticatedUser(Authentication authentication) {
        // @PreAuthorize already guarantees authentication is valid and not null
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OidcUser oidcUser = (OidcUser) authentication.getPrincipal();
        
        String registrationId = oauthToken.getAuthorizedClientRegistrationId();
        String sub = oidcUser.getSubject();
        
        return userRepository.findByIssuerAndSub(registrationId, sub)
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "User not found in database"));
    }

    /**
     * Verifies that the given user owns the file element (or its parent project).
     * This is the central place for ownership validation logic.
     * In the future, this can be extended to support roles, groups, and permissions.
     *
     * @param element The file element to check ownership for
     * @param user The user to verify ownership against
     * @throws ResponseStatusException with 403 FORBIDDEN if the user does not own the element
     */
    public void verifyOwnership(FileElement<?> element, User user) {
        Project project = element.findProject()
                .orElseThrow(() -> new ResponseStatusException(FORBIDDEN, "Access denied: Element is not associated with a project"));
        
        if (project.getOwner() == null || !project.getOwner().getId().equals(user.getId())) {
            throw new ResponseStatusException(FORBIDDEN, "Access denied: You do not have permission to access this resource");
        }
    }

    /**
     * Verifies that the given user owns the project.
     *
     * @param project The project to check ownership for
     * @param user The user to verify ownership against
     * @throws ResponseStatusException with 403 FORBIDDEN if the user does not own the project
     */
    public void verifyOwnership(Project project, User user) {
        if (project.getOwner() == null || !project.getOwner().getId().equals(user.getId())) {
            throw new ResponseStatusException(FORBIDDEN, "Access denied: You do not have permission to access this project");
        }
    }

    /**
     * Verifies ownership of a file element by retrieving the current authenticated user.
     * Used by the permission evaluator.
     *
     * @param element The file element to check
     * @throws ResponseStatusException with 403 FORBIDDEN if ownership verification fails
     */
    public void verifyOwnership(FileElement<?> element) {
        // This method is called by CustomPermissionEvaluator
        // The authentication context is checked there, so we just verify the element has a valid owner
        Project project = element.findProject()
                .orElseThrow(() -> new ResponseStatusException(FORBIDDEN, "Access denied: Element is not associated with a project"));
        
        if (project.getOwner() == null) {
            throw new ResponseStatusException(FORBIDDEN, "Access denied: Resource has no owner");
        }
    }

    /**
     * Verifies ownership of a project without explicit user parameter.
     * Used by the permission evaluator.
     *
     * @param project The project to check
     * @throws ResponseStatusException with 403 FORBIDDEN if ownership verification fails
     */
    public void verifyOwnership(Project project) {
        if (project.getOwner() == null) {
            throw new ResponseStatusException(FORBIDDEN, "Access denied: Project has no owner");
        }
    }
}
