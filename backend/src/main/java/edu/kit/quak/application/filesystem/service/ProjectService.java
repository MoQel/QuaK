package edu.kit.quak.application.filesystem.service;

import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.core.filesystem.model.User;
import edu.kit.quak.files.repository.ProjectRepository;
import edu.kit.quak.files.repository.savers.FileElementSaversRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

/**
 * Service for project-related business logic.
 * Handles project operations such as creation, retrieval, updating, and deletion.
 *
 * @author QuaK Team
 */
@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final FileElementSaversRepository savers;
    private final UserService userService;

    public ProjectService(ProjectRepository projectRepository, 
                         FileElementSaversRepository savers, 
                         UserService userService) {
        this.projectRepository = projectRepository;
        this.savers = savers;
        this.userService = userService;
    }

    /**
     * Retrieves all projects owned by the user.
     *
     * @param user The user whose projects to retrieve
     * @return List of projects owned by the user
     */
    public List<Project> getAllProjectsForUser(User user) {
        return projectRepository.findAllByOwner(user);
    }

    /**
     * Creates a new project for the user.
     *
     * @param project The project to create
     * @param user The user creating the project
     * @return The created project
     * @throws ResponseStatusException if the project already contains files
     */
    public Project createProject(Project project, User user) {
        project.setId(null);
        project.setOwner(user);
        if (!project.getElements().isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "New Projects cannot already contain files");
        }
        return projectRepository.save(project);
    }

    /**
     * Retrieves a project by its ID and verifies ownership.
     *
     * @param projectId The ID of the project
     * @param user The user requesting the project
     * @return The project
     * @throws ResponseStatusException if the project is not found
     */
    public Project getProject(String projectId, User user) {
        Project project = projectRepository.findById(projectId).orElseThrow(
                () -> new ResponseStatusException(BAD_REQUEST, "Given id does not map to a project")
        );
        userService.verifyOwnership(project, user);
        return project;
    }

    /**
     * Updates an existing project with new data.
     *
     * @param projectId The ID of the project to update
     * @param modified The project with modified data
     * @param user The user updating the project
     * @return The updated project
     * @throws ResponseStatusException if the project is not found or update fails
     */
    public Project updateProject(String projectId, Project modified, User user) {
        Project original = getProject(projectId, user);
        try {
            original.patch(modified);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(BAD_REQUEST, e.getMessage());
        }
        projectRepository.save(original);
        return original;
    }

    /**
     * Deletes a project by its ID.
     *
     * @param projectId The ID of the project to delete
     * @param user The user deleting the project
     * @throws ResponseStatusException if the project is not found
     */
    public void deleteProject(String projectId, User user) {
        getProject(projectId, user); // Check ownership
        savers.delete(projectId, Project.class);
    }
}
