package edu.kit.quak.infrastructure.user.in.web.rest;

import edu.kit.quak.application.user.ports.in.UserServicePort;
import edu.kit.quak.core.user.model.AuthenticatedUser;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.infrastructure.user.in.web.rest.dto.UserResponse;
import edu.kit.quak.infrastructure.user.in.web.rest.mapper.AuthenticationMapper;
import edu.kit.quak.infrastructure.user.in.web.rest.mapper.UserDtoMapper;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST adapter for user-related endpoints. Handles HTTP-specific concerns and converts framework
 * types to domain types.
 */
@RestController
@RequestMapping("/api")
@Tag(name = "Authentication", description = "Authentication and user session management endpoints")
public class UserRestAdapter {

    private final UserServicePort userService;
    private final UserDtoMapper userDtoMapper;
    private final AuthenticationMapper authMapper;

    public UserRestAdapter(
            UserServicePort userService,
            UserDtoMapper userDtoMapper,
            AuthenticationMapper authMapper) {
        this.userService = userService;
        this.userDtoMapper = userDtoMapper;
        this.authMapper = authMapper;
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public UserResponse getCurrentUser(Authentication authentication) {
        AuthenticatedUser authUser = authMapper.toDomain(authentication);
        User user = userService.getAuthenticatedUser(authUser);
        return userDtoMapper.toResponse(user);
    }
}
