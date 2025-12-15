package edu.kit.quak.application.filesystem.services;

import edu.kit.quak.application.filesystem.ports.in.ProjectServicePort;
import edu.kit.quak.application.filesystem.ports.out.ProjectRepositoryPort;
import edu.kit.quak.core.filesystem.model.Project;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ProjectService implements ProjectServicePort {

    private final ProjectRepositoryPort repository;

    public ProjectService(ProjectRepositoryPort repository) {
        this.repository = repository;
    }

    @Override
    public Project createProject(Project container) {
        return repository.save(container);
    }

    @Override
    public Project renameProject(String pId, String newName ) {
        Project project = repository.findById(pId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found with ID" + pId));
        project.rename(newName);
        return repository.save(project);
    }

    @Override
    public void removeProject(String id) {
        repository.deleteById(id);
    }

    @Override
    public Project retrieveProject(String id) {
        return repository.findById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Given id does not map to a project")
        );
    }

    @Override
    public List<Project> listProjects() {
        return repository.getAllProjects();
    }
}
