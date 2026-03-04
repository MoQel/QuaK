package edu.kit.quak.application.filesystem.services;

import edu.kit.quak.application.filesystem.exceptions.AccessDeniedException;
import edu.kit.quak.application.filesystem.ports.in.ProjectServicePort;
import edu.kit.quak.application.filesystem.ports.out.ProjectRepositoryPort;
import edu.kit.quak.application.user.ports.in.ProjectRoleServicePort;
import edu.kit.quak.application.user.ports.out.ProjectRoleRepositoryPort;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.core.user.model.ProjectRole;
import edu.kit.quak.core.user.model.ProjectRoleAssignment;
import edu.kit.quak.core.user.model.User;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Stream;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@Slf4j
public class ProjectService implements ProjectServicePort {

    private final ProjectRepositoryPort repository;
    private final ProjectRoleServicePort roleService;
    private final ProjectRoleRepositoryPort roleRepository;

    public ProjectService(ProjectRepositoryPort repository, ProjectRoleServicePort roleService, ProjectRoleRepositoryPort roleRepository) {
        this.repository = repository;
        this.roleService = roleService;
        this.roleRepository = roleRepository;
    }

    @Override
    public Project createProject(Project project, User user) {
        log.info("Creating project '{}' for user '{}'", project.getName(), user.getId());
        checkForDuplicateProjectName(project.getName(), null, user);
        project.setOwnerId(user.getId());
        Project savedProject = repository.save(project);

        // Auto-assign OWNER role to the creator
        ProjectRoleAssignment ownerRole = new ProjectRoleAssignment(user.getId(), savedProject.getId(), ProjectRole.OWNER);
        roleRepository.save(ownerRole);
        log.info("Assigned OWNER role to user '{}' for project '{}'", user.getId(), savedProject.getId());

        return savedProject;
    }

    @Override
    public Project renameProject(String pId, String newName, User user) {
        log.info("Renaming project '{}' to '{}' for user '{}'", pId, newName, user.getId());
        Project project = repository.findById(pId).orElseThrow(NoSuchElementException::new);

        verifyOwnerAccess(project, user);
        checkForDuplicateProjectName(newName, pId, user);

        project.rename(newName);
        return repository.save(project);
    }

    @Override
    public void removeProject(String id, User user) {
        log.info("Removing project '{}' for user '{}'", id, user.getId());
        Project project = repository.findById(id).orElseThrow(NoSuchElementException::new);

        verifyOwnerAccess(project, user);

        // Clean up all role assignments for this project
        roleRepository.deleteAllByProjectId(id);
        repository.deleteById(id);
    }

    @Override
    public Project retrieveProject(String id, User user) {
        log.debug("Retrieving project '{}' for user '{}'", id, user.getId());
        Project project = repository.findById(id).orElseThrow(NoSuchElementException::new);

        // Both OWNER and VIEWER can retrieve a project
        verifyAccess(project, user);

        return project;
    }

    // TODO - Maybe seperate this into multiple methods (one for owned projects, one
    // for viewer projects).
    @Override
    public List<Project> listProjects(User user) {
        log.debug("Listing projects for user '{}'", user.getId());

        // Get projects owned by the user
        List<Project> ownedProjects = repository.getProjectsByOwnerId(user.getId());

        // Get projects where the user has VIEWER role
        List<ProjectRoleAssignment> viewerAssignments = roleRepository.findAllByUserIdAndRole(user.getId(), ProjectRole.VIEWER);

        List<Project> viewerProjects = viewerAssignments
            .stream()
            .map(assignment -> repository.findById(assignment.getProjectId()))
            .filter(java.util.Optional::isPresent)
            .map(java.util.Optional::get)
            .toList();

        // Merge both lists, avoiding duplicates
        return Stream.concat(ownedProjects.stream(), viewerProjects.stream()).distinct().toList();
    }

    /**
     * Verifies that the given user has at least VIEWER access to the project (OWNER
     * or VIEWER).
     *
     * @throws AccessDeniedException if user has no role on the project
     */
    private void verifyAccess(Project project, User user) {
        if (!roleService.hasMinimumRole(project.getId(), user.getId(), ProjectRole.VIEWER)) {
            log.debug("Access denied: User '{}' has no role on project '{}'", user.getId(), project.getId());
            throw new AccessDeniedException("project", project.getId());
        }
    }

    /**
     * Verifies that the given user is the OWNER of the project.
     *
     * @throws AccessDeniedException if user is not the owner
     */
    private void verifyOwnerAccess(Project project, User user) {
        if (!roleService.hasMinimumRole(project.getId(), user.getId(), ProjectRole.OWNER)) {
            log.debug("Access denied: User '{}' is not OWNER of project '{}'", user.getId(), project.getId());
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
