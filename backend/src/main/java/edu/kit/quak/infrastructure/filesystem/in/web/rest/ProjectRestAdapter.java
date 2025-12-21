package edu.kit.quak.infrastructure.filesystem.in.web.rest;

import edu.kit.quak.application.filesystem.ports.in.ProjectServicePort;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.core.user.model.AuthenticatedUser;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.ProjectContentsResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.ProjectDetailsResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.ProjectRequest;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.mapper.ProjectDtoMapper;
import edu.kit.quak.infrastructure.user.in.web.rest.mapper.AuthenticationMapper;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST adapter for project-related endpoints.
 * Handles HTTP-specific concerns and converts framework types to domain types.
 */
@RestController
@RequestMapping("/api/project")
public class ProjectRestAdapter {

    private final ProjectServicePort service;
    private final ProjectDtoMapper mapper;
    private final AuthenticationMapper authMapper;

    public ProjectRestAdapter(ProjectServicePort service, ProjectDtoMapper mapper,
            AuthenticationMapper authMapper) {
        this.service = service;
        this.mapper = mapper;
        this.authMapper = authMapper;
    }

    @GetMapping({ "", "/" })
    public List<ProjectDetailsResponse> getProjects(Authentication authentication) {
        AuthenticatedUser authUser = authMapper.toDomain(authentication);
        List<Project> projects = service.listProjects(authUser);
        return mapper.toDetailsResponseList(projects);
    }

    @PostMapping({ "", "/" })
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectDetailsResponse createProject(@RequestBody ProjectRequest request,
            Authentication authentication) {
        AuthenticatedUser authUser = authMapper.toDomain(authentication);
        Project projectToCreate = mapper.toDomain(request);
        Project createdProject = service.createProject(projectToCreate, authUser);
        return mapper.toDetailsResponse(createdProject);
    }

    @GetMapping("/{pId}")
    public ProjectContentsResponse retrieveProject(@PathVariable String pId,
            Authentication authentication) {
        AuthenticatedUser authUser = authMapper.toDomain(authentication);
        Project project = service.retrieveProject(pId, authUser);
        return mapper.toContentsResponse(project);
    }

    @DeleteMapping("/{pId}")
    public void deleteProject(@PathVariable String pId, Authentication authentication) {
        AuthenticatedUser authUser = authMapper.toDomain(authentication);
        service.removeProject(pId, authUser);
    }

    @PatchMapping("/{pId}")
    public ProjectDetailsResponse renameProject(@PathVariable String pId,
            @RequestBody ProjectRequest request,
            Authentication authentication) {
        AuthenticatedUser authUser = authMapper.toDomain(authentication);
        Project updatedProject = service.renameProject(pId, request.name(), authUser);
        return mapper.toDetailsResponse(updatedProject);
    }
}
