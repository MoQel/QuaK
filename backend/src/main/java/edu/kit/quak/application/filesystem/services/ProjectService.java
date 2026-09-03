package edu.kit.quak.application.filesystem.services;

import edu.kit.quak.application.circuit.ports.in.CircuitServicePort;
import edu.kit.quak.application.common.exceptions.AccessDeniedException;
import edu.kit.quak.application.filesystem.exception.ProjectNotFoundException;
import edu.kit.quak.application.filesystem.ports.in.ProjectServicePort;
import edu.kit.quak.application.filesystem.ports.out.FileContentRepositoryPort;
import edu.kit.quak.application.filesystem.ports.out.ProjectRepositoryPort;
import edu.kit.quak.application.user.ports.in.ProjectRoleServicePort;
import edu.kit.quak.application.user.ports.out.ProjectRoleRepositoryPort;
import edu.kit.quak.core.filesystem.exception.DuplicateNameException;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.core.user.model.ProjectRole;
import edu.kit.quak.core.user.model.ProjectRoleAssignment;
import edu.kit.quak.core.user.model.User;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Stream;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@Slf4j
public class ProjectService implements ProjectServicePort {

    private static final String INITIAL_QASM_FILE_NAME = "ripple_carry_adder.qasm";
    private static final String INITIAL_QASM_CONTENT = """
        // quantum ripple-carry adder
        // Cuccaro et al, quant-ph/0410184
        OPENQASM 2.0;
        include "qelib1.inc";

        gate majority a, b, c
        {
          cx c, b;
          cx c, a;
          ccx a, b, c;
        }

        gate unmaj a, b, c
        {
          ccx a, b, c;
          cx c, a;
          cx a, b;
        }

        qreg cin[1];
        qreg a[4];
        qreg b[4];
        qreg cout[1];
        creg ans[5];

        // set input states: a = 0001, b = 1111
        x a[0];
        x b[0];
        x b[1];
        x b[2];
        x b[3];

        // add a to b, storing result in b
        majority cin[0], b[0], a[0];
        majority a[0], b[1], a[1];
        majority a[1], b[2], a[2];
        majority a[2], b[3], a[3];
        cx a[3], cout[0];
        unmaj a[2], b[3], a[3];
        unmaj a[1], b[2], a[2];
        unmaj a[0], b[1], a[1];
        unmaj cin[0], b[0], a[0];

        measure b[0] -> ans[0];
        measure b[1] -> ans[1];
        measure b[2] -> ans[2];
        measure b[3] -> ans[3];
        measure cout[0] -> ans[4];
        """;

    private final ProjectRepositoryPort repository;
    private final FileContentRepositoryPort fileContentRepository;
    private final ProjectRoleServicePort roleService;
    private final ProjectRoleRepositoryPort roleRepository;
    private final CircuitServicePort circuitService;

    public ProjectService(
        ProjectRepositoryPort repository,
        FileContentRepositoryPort fileContentRepository,
        ProjectRoleServicePort roleService,
        ProjectRoleRepositoryPort roleRepository,
        CircuitServicePort circuitService
    ) {
        this.repository = repository;
        this.fileContentRepository = fileContentRepository;
        this.roleService = roleService;
        this.roleRepository = roleRepository;
        this.circuitService = circuitService;
    }

    @Override
    public Project createProject(Project project, User user) {
        log.info("Creating project '{}' for user '{}'", project.getName(), user.getId());
        checkForDuplicateProjectName(project.getName(), null, user);
        project.setOwnerId(user.getId());
        File initialFile = new File(INITIAL_QASM_FILE_NAME, project.getId());
        project.addChild(initialFile);
        Project savedProject = repository.save(project);
        fileContentRepository.saveContent(initialFile.getId(), INITIAL_QASM_CONTENT.getBytes(StandardCharsets.UTF_8));

        // Auto-assign OWNER role to the creator
        ProjectRoleAssignment ownerRole = new ProjectRoleAssignment(user.getId(), savedProject.getId(), ProjectRole.OWNER);
        roleRepository.save(ownerRole);
        log.info("Assigned OWNER role to user '{}' for project '{}'", user.getId(), savedProject.getId());

        return savedProject;
    }

    @Override
    public Project renameProject(String pId, String newName, User user) {
        log.info("Renaming project '{}' to '{}' for user '{}'", pId, newName, user.getId());
        Project project = retrieveWithoutAuth(pId);

        verifyOwnerAccess(project, user);
        checkForDuplicateProjectName(newName, pId, user);

        project.rename(newName);
        return repository.save(project);
    }

    @Override
    public void removeProject(String pId, User user) {
        log.info("Removing project '{}' for user '{}'", pId, user.getId());
        Project project = retrieveWithoutAuth(pId);

        verifyOwnerAccess(project, user);

        // Removes all circuits linked to the project's files
        circuitService.deleteAllByProjectId(pId);
        // Clean up all role assignments for this project
        roleRepository.deleteAllByProjectId(pId);
        repository.deleteById(pId);
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
