package edu.kit.quak.application.filesystem.services;

import edu.kit.quak.application.filesystem.exceptions.AccessDeniedException;
import edu.kit.quak.application.filesystem.ports.in.ProjectServicePort;
import edu.kit.quak.application.filesystem.ports.out.ProjectRepositoryPort;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.core.user.model.User;
import java.util.List;
import java.util.NoSuchElementException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@Slf4j
public class ProjectService implements ProjectServicePort {

    private final ProjectRepositoryPort repository;

    public ProjectService(ProjectRepositoryPort repository) {
        this.repository = repository;
    }

    @Override
    public Project createProject(Project project, User user) {
        log.info("Creating project '{}' for user '{}'", project.getName(), user.getId());
        checkForDuplicateProjectName(project.getName(), null, user);
        project.setOwnerId(user.getId());
        return repository.save(project);
    }

    @Override
    public Project renameProject(String pId, String newName, User user) {
        log.info("Renaming project '{}' to '{}' for user '{}'", pId, newName, user.getId());
        Project project = repository.findById(pId).orElseThrow(NoSuchElementException::new);

        verifyOwnership(project, user);
        checkForDuplicateProjectName(newName, pId, user);

        project.rename(newName);
        return repository.save(project);
    }

    @Override
    public void removeProject(String id, User user) {
        log.info("Removing project '{}' for user '{}'", id, user.getId());
        Project project = repository.findById(id).orElseThrow(NoSuchElementException::new);

        verifyOwnership(project, user);

        repository.deleteById(id);
    }

    @Override
    public Project retrieveProject(String id, User user) {
        log.debug("Retrieving project '{}' for user '{}'", id, user.getId());
        Project project = repository.findById(id).orElseThrow(NoSuchElementException::new);

        verifyOwnership(project, user);

        return project;
    }

    @Override
    public List<Project> listProjects(User user) {
        log.debug("Listing projects for user '{}'", user.getId());
        return repository.getProjectsByOwnerId(user.getId());
    }

    /**
     * Verifies that the given user owns the given project.
     *
     * @throws AccessDeniedException if user doesn't own the project
     */
    private void verifyOwnership(Project project, User user) {
        if (project.getOwnerId() == null || !project.getOwnerId().equals(user.getId())) {
            log.debug("Access denied: User '{}' does not own project '{}'", user.getId(), project.getId());
            throw new AccessDeniedException("project", project.getId());
        }
    }

    /**
     * Checks that no other project owned by the same user already has the given
     * name (case-insensitive).
     *
     * @param name             the desired name
     * @param excludeProjectId the ID of the project being renamed (null for
     *                         creation)
     * @param user             the owner
     * @throws IllegalArgumentException if a duplicate name exists
     */
    private void checkForDuplicateProjectName(String name, String excludeProjectId, User user) {
        boolean nameExists = repository
            .getProjectsByOwnerId(user.getId())
            .stream()
            .filter(p -> excludeProjectId == null || !p.getId().equals(excludeProjectId))
            .anyMatch(p -> p.getName().equalsIgnoreCase(name));

        if (nameExists) {
            throw new IllegalArgumentException("A project with the name '" + name + "' already exists");
        }
    }
}
