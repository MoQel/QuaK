package edu.kit.quak.infrastructure.filesystem.in.web.rest;

import edu.kit.quak.application.filesystem.ports.in.ProjectServicePort;
import edu.kit.quak.application.user.ports.in.UserServicePort;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.ProjectContentsResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.ProjectDetailsResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.ProjectRequest;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.mapper.ProjectDtoMapper;
import edu.kit.quak.infrastructure.user.in.web.rest.dto.UserResponse;
import edu.kit.quak.infrastructure.user.in.web.rest.mapper.AuthenticationMapper;
import edu.kit.quak.infrastructure.user.in.web.rest.mapper.UserDtoMapper;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * REST adapter for project-related endpoints. Handles HTTP-specific concerns
 * and converts framework
 * types to domain types.
 */
@RestController
@RequestMapping("/api/project")
@Tag(name = "Projects", description = "Project management operations")
public class ProjectRestAdapter {

    private final ProjectServicePort service;
    private final UserServicePort userService;
    private final ProjectDtoMapper mapper;
    private final AuthenticationMapper authMapper;
    private final UserDtoMapper userDtoMapper;

    public ProjectRestAdapter(
        ProjectServicePort service,
        UserServicePort userService,
        ProjectDtoMapper mapper,
        AuthenticationMapper authMapper,
        UserDtoMapper userDtoMapper
    ) {
        this.service = service;
        this.userService = userService;
        this.mapper = mapper;
        this.authMapper = authMapper;
        this.userDtoMapper = userDtoMapper;
    }

    @GetMapping({ "", "/" })
    @PreAuthorize("isAuthenticated()")
    public List<ProjectDetailsResponse> getProjects(Authentication authentication) {
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        List<Project> projects = service.listProjects(user);

        // Collect all unique owner IDs
        List<UUID> ownerIds = projects.stream().map(Project::getOwnerId).filter(Objects::nonNull).distinct().toList();

        // Fetch owners in a single batch call to avoid N+1 problem
        Map<UUID, UserResponse> ownersMap = userService
            .findAllByIds(ownerIds)
            .stream()
            .map(userDtoMapper::toResponse)
            .collect(Collectors.toMap(UserResponse::userId, Function.identity()));

        return projects
            .stream()
            .map(project -> {
                UserResponse ownerResponse = project.getOwnerId() == null ? null : ownersMap.get(project.getOwnerId());
                return mapper.toDetailsResponse(project, ownerResponse);
            })
            .toList();
    }

    @PostMapping({ "", "/" })
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public ProjectDetailsResponse createProject(@RequestBody ProjectRequest request, Authentication authentication) {
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        Project projectToCreate = mapper.toDomain(request);
        Project createdProject = service.createProject(projectToCreate, user);
        return mapper.toDetailsResponse(createdProject);
    }

    @GetMapping("/{pId}")
    @PreAuthorize("isAuthenticated()")
    public ProjectContentsResponse retrieveProject(@PathVariable String pId, Authentication authentication) {
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        Project project = service.retrieveProject(pId, user);
        return mapper.toContentsResponse(project);
    }

    @DeleteMapping("/{pId}")
    @PreAuthorize("isAuthenticated()")
    public void deleteProject(@PathVariable String pId, Authentication authentication) {
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        service.removeProject(pId, user);
    }

    @PatchMapping("/{pId}")
    @PreAuthorize("isAuthenticated()")
    public ProjectDetailsResponse renameProject(
        @PathVariable String pId,
        @RequestBody ProjectRequest request,
        Authentication authentication
    ) {
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        Project updatedProject = service.renameProject(pId, request.name(), user);
        return mapper.toDetailsResponse(updatedProject);
    }
}
