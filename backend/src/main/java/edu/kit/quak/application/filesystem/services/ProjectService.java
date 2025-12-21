package edu.kit.quak.application.filesystem.services;

import edu.kit.quak.application.filesystem.exceptions.AccessDeniedException;
import edu.kit.quak.application.filesystem.ports.in.ProjectServicePort;
import edu.kit.quak.application.filesystem.ports.out.ProjectRepositoryPort;
import edu.kit.quak.application.user.ports.in.UserServicePort;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.core.user.model.AuthenticatedUser;
import edu.kit.quak.core.user.model.User;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class ProjectService implements ProjectServicePort {

    private final ProjectRepositoryPort repository;
    private final UserServicePort userService;

    public ProjectService(ProjectRepositoryPort repository, UserServicePort userService) {
        this.repository = repository;
        this.userService = userService;
    }

    @Override
    public Project createProject(Project project, AuthenticatedUser authenticatedUser) {
        User user = userService.getAuthenticatedUser(authenticatedUser);
        project.setOwnerId(user.getId());
        return repository.save(project);
    }

    @Override
    public Project renameProject(String pId, String newName, AuthenticatedUser authenticatedUser) {
        User user = userService.getAuthenticatedUser(authenticatedUser);
        Project project = repository.findById(pId)
                .orElseThrow(NoSuchElementException::new);

        verifyOwnership(project, user);

        project.rename(newName);
        return repository.save(project);
    }

    @Override
    public void removeProject(String id, AuthenticatedUser authenticatedUser) {
        User user = userService.getAuthenticatedUser(authenticatedUser);
        Project project = repository.findById(id)
                .orElseThrow(NoSuchElementException::new);

        verifyOwnership(project, user);

        repository.deleteById(id);
    }

    @Override
    public Project retrieveProject(String id, AuthenticatedUser authenticatedUser) {
        User user = userService.getAuthenticatedUser(authenticatedUser);
        Project project = repository.findById(id)
                .orElseThrow(NoSuchElementException::new);

        verifyOwnership(project, user);

        return project;
    }

    @Override
    public List<Project> listProjects(AuthenticatedUser authenticatedUser) {
        User user = userService.getAuthenticatedUser(authenticatedUser);
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
