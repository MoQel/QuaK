package edu.kit.quak.infrastructure.user.in.web.rest;

import edu.kit.quak.application.user.ports.in.ProjectRoleServicePort;
import edu.kit.quak.application.user.ports.in.UserServicePort;
import edu.kit.quak.core.user.model.ProjectRole;
import edu.kit.quak.core.user.model.ProjectRoleAssignment;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.infrastructure.user.in.web.rest.dto.ProjectRoleRequest;
import edu.kit.quak.infrastructure.user.in.web.rest.dto.ProjectRoleResponse;
import edu.kit.quak.infrastructure.user.in.web.rest.mapper.AuthenticationMapper;
import edu.kit.quak.infrastructure.user.in.web.rest.mapper.ProjectRoleDtoMapper;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * REST adapter for project role management endpoints. Allows project owners to
 * assign and manage
 * roles for their projects.
 */
@RestController
@RequestMapping("/api/project/{pId}/roles")
@Tag(name = "Project Roles", description = "Project role management operations")
public class ProjectRoleRestAdapter {

    private final ProjectRoleServicePort roleService;
    private final UserServicePort userService;
    private final ProjectRoleDtoMapper mapper;
    private final AuthenticationMapper authMapper;

    public ProjectRoleRestAdapter(
        ProjectRoleServicePort roleService,
        UserServicePort userService,
        ProjectRoleDtoMapper mapper,
        AuthenticationMapper authMapper
    ) {
        this.roleService = roleService;
        this.userService = userService;
        this.mapper = mapper;
        this.authMapper = authMapper;
    }

    /**
     * Lists all role assignments for a project. Only the project owner can call
     * this.
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<ProjectRoleResponse> getRoles(@PathVariable String pId, Authentication authentication) {
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        List<ProjectRoleAssignment> roles = roleService.getRolesForProject(pId, user);
        return mapper.toResponseList(roles);
    }

    /**
     * Assigns a role to a user for a project. Only the project owner can call this.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public ProjectRoleResponse assignRole(
        @PathVariable String pId,
        @RequestBody ProjectRoleRequest request,
        Authentication authentication
    ) {
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        UUID targetUserId = UUID.fromString(request.userId());
        ProjectRole role = ProjectRole.valueOf(request.role().toUpperCase());
        ProjectRoleAssignment assignment = roleService.assignRole(pId, targetUserId, role, user);
        return mapper.toResponse(assignment);
    }

    /**
     * Removes a user's role from a project. Only the project owner can call this.
     */
    @DeleteMapping("/{userId}")
    @PreAuthorize("isAuthenticated()")
    public void removeRole(@PathVariable String pId, @PathVariable String userId, Authentication authentication) {
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        UUID targetUserId = UUID.fromString(userId);
        roleService.removeRole(pId, targetUserId, user);
    }

    /**
     * Gets the current user's role for a project. Any authenticated user can check
     * their own role.
     */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ProjectRoleResponse getMyRole(@PathVariable String pId, Authentication authentication) {
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        ProjectRole role = roleService.getUserRoleForProject(pId, user.getId());

        if (role == null) {
            return new ProjectRoleResponse(user.getId(), pId, null, user.getEmail(), user.getName(), user.getAvatarUrl());
        }
        return new ProjectRoleResponse(user.getId(), pId, role.name(), user.getEmail(), user.getName(), user.getAvatarUrl());
    }
}
