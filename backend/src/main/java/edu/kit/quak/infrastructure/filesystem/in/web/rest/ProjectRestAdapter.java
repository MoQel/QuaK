package edu.kit.quak.infrastructure.filesystem.in.web.rest;

import edu.kit.quak.application.filesystem.ports.in.ProjectServicePort;
import edu.kit.quak.application.user.ports.in.UserServicePort;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.ProjectContentsResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.ProjectDetailsResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.ProjectRequest;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.mapper.ProjectDtoMapper;
import edu.kit.quak.infrastructure.user.in.web.rest.mapper.AuthenticationMapper;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * REST adapter for project-related endpoints. Handles HTTP-specific concerns and converts framework
 * types to domain types.
 */
@Slf4j
@RestController
@RequestMapping("/api/project")
@Tag(name = "Projects", description = "Project management operations")
public class ProjectRestAdapter {

    private final ProjectServicePort service;
    private final UserServicePort userService;
    private final ProjectDtoMapper mapper;
    private final AuthenticationMapper authMapper;

    public ProjectRestAdapter(
        ProjectServicePort service,
        UserServicePort userService,
        ProjectDtoMapper mapper,
        AuthenticationMapper authMapper
    ) {
        this.service = service;
        this.userService = userService;
        this.mapper = mapper;
        this.authMapper = authMapper;
    }

    @GetMapping({ "", "/" })
    @PreAuthorize("isAuthenticated()")
    public List<ProjectDetailsResponse> getProjects(Authentication authentication) {
        log.debug("REST request to retrieve all projects of a user");
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        List<Project> projects = service.listProjects(user);
        return mapper.toDetailsResponseList(projects);
    }

    @PostMapping({ "", "/" })
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public ProjectDetailsResponse createProject(@RequestBody ProjectRequest request, Authentication authentication) {
        log.info("REST request to create a project");
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        Project projectToCreate = mapper.toDomain(request);
        Project createdProject = service.createProject(projectToCreate, user);
        return mapper.toDetailsResponse(createdProject);
    }

    @GetMapping("/{pId}")
    @PreAuthorize("isAuthenticated()")
    public ProjectContentsResponse retrieveProject(@PathVariable String pId, Authentication authentication) {
        log.debug("REST request to retrieve project '{}'", pId);
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        Project project = service.retrieveProject(pId, user);
        return mapper.toContentsResponse(project);
    }

    @DeleteMapping("/{pId}")
    @PreAuthorize("isAuthenticated()")
    public void deleteProject(@PathVariable String pId, Authentication authentication) {
        log.debug("REST request to delete project '{}'", pId);
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
        log.debug("REST request to rename project '{}'", pId);
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        Project updatedProject = service.renameProject(pId, request.name(), user);
        return mapper.toDetailsResponse(updatedProject);
    }
}
