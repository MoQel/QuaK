package edu.kit.quak.application.filesystem.services;

import edu.kit.quak.application.filesystem.exceptions.AccessDeniedException;
import edu.kit.quak.application.filesystem.ports.in.ProjectServicePort;
import edu.kit.quak.application.filesystem.ports.out.ProjectRepositoryPort;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.core.user.model.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@Transactional
public class ProjectService implements ProjectServicePort {

    private final ProjectRepositoryPort repository;

    public ProjectService(ProjectRepositoryPort repository) {
        this.repository = repository;
    }

    @Override
    public Project createProject(Project project, User user) {
        project.setOwnerId(user.getId());
        return repository.save(project);
    }

    @Override
    public Project renameProject(String pId, String newName, User user) {
        Project project = repository.findById(pId)
                .orElseThrow(NoSuchElementException::new);

        verifyOwnership(project, user);

        project.rename(newName);
        return repository.save(project);
    }

    @Override
    public void removeProject(String id, User user) {
        Project project = repository.findById(id)
                .orElseThrow(NoSuchElementException::new);

        verifyOwnership(project, user);

        repository.deleteById(id);
    }

    @Override
    public Project retrieveProject(String id, User user) {
        Project project = repository.findById(id)
                .orElseThrow(NoSuchElementException::new);

        verifyOwnership(project, user);

        return project;
    }

    @Override
    public List<Project> listProjects(User user) {
        return repository.getProjectsByOwnerId(user.getId());
    }

    /**
     * Verifies that the given user owns the given project.
     * 
     * @throws AccessDeniedException if user doesn't own the project
     */
    private void verifyOwnership(Project project, User user) {
        if (project.getOwnerId() == null || !project.getOwnerId().equals(user.getId())) {
            throw new AccessDeniedException("project", project.getId());
        }
    }
}
