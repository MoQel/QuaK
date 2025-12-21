package edu.kit.quak.infrastructure.filesystem.in.web.rest;

import edu.kit.quak.application.filesystem.ports.in.ProjectServicePort;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.ProjectContentsResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.ProjectDetailsResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.ProjectRequest;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.mapper.ProjectDtoMapper;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/project")
public class ProjectRestAdapter {

    private final ProjectServicePort service;
    private final ProjectDtoMapper mapper;

    public ProjectRestAdapter(ProjectServicePort service, ProjectDtoMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @GetMapping({"", "/"})
    public List<ProjectDetailsResponse> getProjects() {
        List<Project> projects = service.listProjects();
        return mapper.toDetailsResponseList(projects);
    }

    @PostMapping({"", "/"})
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectDetailsResponse createProject(@RequestBody ProjectRequest request) {
        Project projectToCreate = mapper.toDomain(request);
        Project createdProject = service.createProject(projectToCreate); // project has no parent
        return mapper.toDetailsResponse(createdProject);
    }

    @GetMapping("/{pId}")
    public ProjectContentsResponse retrieveProject(@PathVariable String pId) {
        Project project =  service.retrieveProject(pId);
        return mapper.toContentsResponse(project);
    }

    @DeleteMapping("/{pId}")
    public void deleteProject(@PathVariable String pId) {
        service.removeProject(pId);
    }

    @PatchMapping("/{pId}")
    public ProjectDetailsResponse renameProject(@PathVariable String pId, @RequestBody ProjectRequest request) {
        Project updatedProject = service.renameProject(pId, request.name());
        return mapper.toDetailsResponse(updatedProject);
    }
}
