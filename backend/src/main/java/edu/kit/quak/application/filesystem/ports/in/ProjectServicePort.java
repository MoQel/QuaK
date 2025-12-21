package edu.kit.quak.application.filesystem.ports.in;

import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.core.user.model.AuthenticatedUser;

import java.util.List;

/**
 * Input port for project-related use cases.
 * Uses only domain concepts, no framework dependencies.
 */
public interface ProjectServicePort {

    /**
     * Creates a new project owned by the authenticated user.
     */
    Project createProject(Project container, AuthenticatedUser authenticatedUser);

    /**
     * Renames a project if the authenticated user owns it.
     */
    Project renameProject(String pId, String newName, AuthenticatedUser authenticatedUser);

    /**
     * Removes a project if the authenticated user owns it.
     */
    void removeProject(String id, AuthenticatedUser authenticatedUser);

    /**
     * Retrieves a project if the authenticated user owns it.
     */
    Project retrieveProject(String id, AuthenticatedUser authenticatedUser);

    /**
     * Lists all projects owned by the authenticated user.
     */
    List<Project> listProjects(AuthenticatedUser authenticatedUser);
}
