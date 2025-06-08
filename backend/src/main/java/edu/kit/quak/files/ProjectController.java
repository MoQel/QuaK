package edu.kit.quak.files;

import edu.kit.quak.files.model.Project;
import edu.kit.quak.files.repository.ProjectRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedList;
import java.util.List;

@RestController
@RequestMapping("/project")
public class ProjectController {

    private final ProjectRepository projects;

    public ProjectController(ProjectRepository projects) {
        this.projects = projects;
    }

    @GetMapping
    public List<Project> getProjects() {
        List<Project> list = new LinkedList<>();
        projects.findAll().forEach(list::add);
        return list;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Project createProject(@RequestBody Project project) {
        project.setId(null);
        if (!project.getContent().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New Projects cannot already contain files");
        }
        return projects.save(project);
    }

    @GetMapping("/{pId}")
    public Project getProject(@PathVariable String pId) {
        return projects.findById(pId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Given id does not map to a project")
        );
    }

    @PatchMapping("/{pId}")
    public Project patchProject(@PathVariable String pId, @RequestBody Project modified) {
        Project original = getProject(pId);
        original.patch(modified);
        projects.save(original);
        return original;
    }
    
    @DeleteMapping("/{pId}")
    public void deleteProject(@PathVariable String pId) {
        Project project = projects.findById(pId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Given id does not map to a project")
        );

        if (project.getContent().isEmpty()) {
            projects.delete(project);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The referenced project still has content");
        }
    }
}
