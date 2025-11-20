package edu.kit.quak.api.rest;

import edu.kit.quak.core.filesystem.domain.FileElementContainer;
import edu.kit.quak.core.filesystem.domain.Project;
import edu.kit.quak.core.filesystem.ports.incoming.FileElementContainerServicePort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/project")
public class ProjectController {

    private final FileElementContainerServicePort service;

    public ProjectController(FileElementContainerServicePort service) {
        this.service = service;
    }

    @GetMapping({"", "/"})
    public List<Project> getProjects() {
        return service.listProjects();
    }

    @PostMapping({"", "/"})
    @ResponseStatus(HttpStatus.CREATED)
    public FileElementContainer<?> createProject(@RequestBody Project project) {
        project.setId(null);
        if (!project.getElements().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New Projects cannot already contain files");
        }
        return service.create(project, null);
    }

    @GetMapping("/{pId}")
    public FileElementContainer<?> getProject(@PathVariable String pId) {
        return service.get(pId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Given id does not map to a project")
        );
    }

    @PatchMapping("/{pId}")
    public FileElementContainer<?> patchProject(@PathVariable String pId, @RequestBody Project modified) {
        FileElementContainer<?> original = getProject(pId);
        try {
            ((Project) original).patch(modified);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
        return service.update(original);
    }

    @DeleteMapping("/{pId}")
    public void deleteProject(@PathVariable String pId) {
        service.delete(pId);
    }
}
