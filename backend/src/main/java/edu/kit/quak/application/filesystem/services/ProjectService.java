package edu.kit.quak.application.filesystem.services;

import edu.kit.quak.application.common.exceptions.AccessDeniedException;
import edu.kit.quak.application.common.ports.out.DomainEventPublisherPort;
import edu.kit.quak.application.filesystem.exception.ProjectNotFoundException;
import edu.kit.quak.application.filesystem.ports.in.ProjectServicePort;
import edu.kit.quak.application.filesystem.ports.out.FileContentRepositoryPort;
import edu.kit.quak.application.filesystem.ports.out.ProjectRepositoryPort;
import edu.kit.quak.application.user.ports.in.ProjectRoleServicePort;
import edu.kit.quak.core.filesystem.event.ProjectDeletedEvent;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.core.filesystem.service.ProjectNaming;
import edu.kit.quak.core.user.model.ProjectRole;
import edu.kit.quak.core.user.model.User;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@Slf4j
public class ProjectService implements ProjectServicePort {

    private static final byte[] INITIAL_FILE_CONTENT = Project.INITIAL_FILE_CONTENT.getBytes(StandardCharsets.UTF_8);

    private final ProjectRepositoryPort repository;
    private final FileContentRepositoryPort fileContentRepository;
    private final ProjectRoleServicePort roleService;
    private final DomainEventPublisherPort eventPublisher;

    public ProjectService(
        ProjectRepositoryPort repository,
        FileContentRepositoryPort fileContentRepository,
        ProjectRoleServicePort roleService,
        DomainEventPublisherPort eventPublisher
    ) {
        this.repository = repository;
        this.fileContentRepository = fileContentRepository;
        this.roleService = roleService;
        this.eventPublisher = eventPublisher;
    }

    @Override
    public Project createProject(Project container, User user) {
        log.info("Creating project '{}' for user '{}'", container.getName(), user.getId());
        ProjectNaming.ensureAvailable(container.getName(), repository.getProjectsByOwnerId(user.getId()));

        Project project = repository.save(Project.create(container.getName(), user.getId()));
        project.allFiles().forEach(file -> fileContentRepository.saveContent(file.getId(), INITIAL_FILE_CONTENT));
        roleService.assignOwner(project.getId(), user.getId());
        return project;
    }

    @Override
    public Project renameProject(String pId, String newName, User user) {
        log.info("Renaming project '{}' to '{}' for user '{}'", pId, newName, user.getId());
        Project project = retrieveWithoutAuth(pId);
        verifyOwnerAccess(project, user);
        ProjectNaming.ensureAvailableForRename(project, newName, repository.getProjectsByOwnerId(user.getId()));

        project.rename(newName);
        return repository.save(project);
    }

    @Override
    public void removeProject(String pId, User user) {
        log.info("Removing project '{}' for user '{}'", pId, user.getId());
        Project project = retrieveWithoutAuth(pId);
        verifyOwnerAccess(project, user);

        delete(project);
    }

    @Override
    public void deleteAllByOwnerId(UUID ownerId) {
        List<Project> projects = repository.getProjectsByOwnerId(ownerId);
        log.info("Removing {} projects owned by user '{}'", projects.size(), ownerId);
        projects.forEach(this::delete);
    }

    @Override
    public void transferAllByOwnerId(UUID fromOwnerId, UUID toOwnerId) {
        List<Project> projects = repository.getProjectsByOwnerId(fromOwnerId);
        log.info("Transferring {} projects from user '{}' to user '{}'", projects.size(), fromOwnerId, toOwnerId);
        ProjectNaming.makeNamesUnique(projects, repository.getProjectsByOwnerId(toOwnerId));
        for (Project project : projects) {
            project.transferTo(toOwnerId);
            repository.save(project);
        }
    }

    @Override
    public Project retrieveProject(String pId, User user) {
        log.debug("Retrieving project '{}' for user '{}'", pId, user.getId());
        Project project = retrieveWithoutAuth(pId);

        // Both OWNER and VIEWER can retrieve a project
        verifyAccess(project, user);

        return project;
    }

    // TODO - Maybe seperate this into multiple methods (one for owned projects, one
    // for viewer projects).
    @Override
    public List<Project> listProjects(User user) {
        log.debug("Listing projects for user '{}'", user.getId());
        List<Project> ownedProjects = repository.getProjectsByOwnerId(user.getId());
        List<Project> viewerProjects = repository.findAllByIds(roleService.findProjectIdsByUserIdAndRole(user.getId(), ProjectRole.VIEWER));

        // Merge both lists, avoiding duplicates
        return Stream.concat(ownedProjects.stream(), viewerProjects.stream()).distinct().toList();
    }

    /** Deletes the project with its file contents; other contexts remove their data on the published event. */
    private void delete(Project project) {
        String pId = project.getId();
        fileContentRepository.deleteContents(project.allFiles().stream().map(File::getId).toList());
        repository.deleteById(pId);
        eventPublisher.publish(new ProjectDeletedEvent(pId));
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
}
