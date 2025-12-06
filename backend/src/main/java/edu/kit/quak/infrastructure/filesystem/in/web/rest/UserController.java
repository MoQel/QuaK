package edu.kit.quak.infrastructure.web.rest;

import edu.kit.quak.application.filesystem.service.UserService;
import edu.kit.quak.core.filesystem.model.User;
import edu.kit.quak.core.filesystem.model.UserDto;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for user-related endpoints.
 * Delegates business logic to UserService.
 *
 * @author QuaK Team
 */
@RestController
@RequestMapping("/api")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public UserDto getCurrentUser(Authentication authentication) {
        User user = userService.getAuthenticatedUser(authentication);
        
        return new UserDto(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getAvatarUrl(),
                user.getEmailVerified()
        );
    }
}
