package edu.kit.quak.application.filesystem.ports.in;

import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.core.user.model.User;
import java.util.List;

/**
 * Input port for project-related use cases. Uses only domain concepts, no framework dependencies.
 */
public interface ProjectServicePort {
    /** Creates a new project owned by the user. */
    Project createProject(Project container, User user);

    /** Renames a project if the user owns it. */
    Project renameProject(String pId, String newName, User user);

    /** Removes a project if the user owns it. */
    void removeProject(String id, User user);

    /** Retrieves a project if the user owns it. */
    Project retrieveProject(String id, User user);

    /** Lists all projects owned by the user. */
    List<Project> listProjects(User user);
}
