package edu.kit.quak.application.filesystem.services;

import edu.kit.quak.application.circuit.ports.in.CircuitServicePort;
import edu.kit.quak.application.common.exceptions.AccessDeniedException;
import edu.kit.quak.application.filesystem.exception.ProjectNotFoundException;
import edu.kit.quak.application.filesystem.ports.in.ProjectServicePort;
import edu.kit.quak.application.filesystem.ports.out.ProjectRepositoryPort;
import edu.kit.quak.core.filesystem.exception.DuplicateNameException;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.core.user.model.User;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@Slf4j
public class ProjectService implements ProjectServicePort {

    private final ProjectRepositoryPort repository;
    private final CircuitServicePort circuitService;

    public ProjectService(ProjectRepositoryPort repository, CircuitServicePort circuitService) {
        this.repository = repository;
        this.circuitService = circuitService;
    }

    @Override
    public Project createProject(Project project, User user) {
        log.info("Creating project '{}' for user '{}'", project.getName(), user.getId());
        checkForDuplicateProjectName(project.getName(), null, user);
        project.setOwnerId(user.getId());
        Project savedProject = repository.save(project);
        circuitService.init(savedProject.getId());
        return savedProject;
    }

    @Override
    public Project renameProject(String pId, String newName, User user) {
        log.info("Renaming project '{}' to '{}' for user '{}'", pId, newName, user.getId());
        Project project = retrieveWithoutAuth(pId);

        verifyOwnership(project, user);
        checkForDuplicateProjectName(newName, pId, user);

        project.rename(newName);
        return repository.save(project);
    }

    @Override
    public void removeProject(String pId, User user) {
        log.info("Removing project '{}' for user '{}'", pId, user.getId());
        Project project = retrieveWithoutAuth(pId);

        verifyOwnership(project, user);

        String cId = circuitService.getByProjectId(pId).getId();
        circuitService.delete(cId);
        repository.deleteById(pId);
    }

    @Override
    public Project retrieveProject(String pId, User user) {
        log.debug("Retrieving project '{}' for user '{}'", pId, user.getId());
        Project project = retrieveWithoutAuth(pId);

        verifyOwnership(project, user);

        return project;
    }

    @Override
    public List<Project> listProjects(User user) {
        log.debug("Listing projects for user '{}'", user.getId());
        return repository.getProjectsByOwnerId(user.getId());
    }

    private Project retrieveWithoutAuth(String id) {
        return repository
            .findById(id)
            .orElseThrow(() -> {
                log.warn("Project not found. projectId={}", id);
                return new ProjectNotFoundException(id);
            });
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
     * @throws DuplicateNameException if a duplicate name exists
     */
    private void checkForDuplicateProjectName(String name, String excludeProjectId, User user) {
        boolean nameExists = repository
            .getProjectsByOwnerId(user.getId())
            .stream()
            .filter(p -> !p.getId().equals(excludeProjectId))
            .anyMatch(p -> p.getName().equalsIgnoreCase(name));

        if (nameExists) {
            throw new DuplicateNameException(name);
        }
    }
}
