package edu.kit.quak.files;

import edu.kit.quak.files.model.FileElement;
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

import static org.springframework.http.HttpStatus.BAD_REQUEST;

/**
 * This controller handles all the calls to the {@code /project/} endpoint.
 * See the API-documentation for further information.
 *
 * @author Henrik K
 */
@RestController
@RequestMapping("/project")
public class ProjectController {

    private final ProjectRepository projects;
    private final FileController fileController;

    public ProjectController(ProjectRepository projects, FileController fileController) {
        this.projects = projects;
        this.fileController = fileController;
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
            throw new ResponseStatusException(BAD_REQUEST, "New Projects cannot already contain files");
        }
        return projects.save(project);
    }

    @GetMapping("/{pId}")
    public Project getProject(@PathVariable String pId) {
        return projects.findById(pId).orElseThrow(
                () -> new ResponseStatusException(BAD_REQUEST, "Given id does not map to a project")
        );
    }

    @PatchMapping("/{pId}")
    public Project patchProject(@PathVariable String pId, @RequestBody Project modified) {
        Project original = getProject(pId);
        try {
            original.patch(modified);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(BAD_REQUEST, e.getMessage());
        }
        projects.save(original);
        return original;
    }
    
    @DeleteMapping("/{pId}")
    public void deleteProject(@PathVariable String pId) {
        Project project = projects.findById(pId).orElseThrow(
                () -> new ResponseStatusException(BAD_REQUEST, "Given id does not map to a project")
        );

        for (FileElement<?> element : project.getContent()) {
            fileController.deleteFile(element.getId());
        }
        projects.delete(project);
    }
}
