package edu.kit.quak.infrastructure.user.in.web.rest;

import edu.kit.quak.application.user.ports.in.UserServicePort;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.infrastructure.user.in.web.rest.dto.UserResponse;
import edu.kit.quak.infrastructure.user.in.web.rest.mapper.UserDtoMapper;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST adapter for user-related endpoints.
 */
@RestController
@RequestMapping("/api")
public class UserRestAdapter {

    private final UserServicePort userService;
    private final UserDtoMapper userDtoMapper;

    public UserRestAdapter(UserServicePort userService, UserDtoMapper userDtoMapper) {
        this.userService = userService;
        this.userDtoMapper = userDtoMapper;
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public UserResponse getCurrentUser(Authentication authentication) {
        User user = userService.getAuthenticatedUser(authentication);
        return userDtoMapper.toResponse(user);
    }
}
