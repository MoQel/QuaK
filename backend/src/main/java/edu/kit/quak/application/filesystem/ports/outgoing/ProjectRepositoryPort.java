package edu.kit.quak.application.filesystem.ports.outgoing;

import edu.kit.quak.core.filesystem.model.FileElementContainer;
import edu.kit.quak.core.filesystem.model.Project;

import java.util.List;
import java.util.Optional;

public interface ProjectRepositoryPort extends FileElementContainerRepositoryPort {
    /**
     * Finds a FileElementContainer by its ID.
     * @param id The ID of the container.
     * @return The domain object, if found.
     */
    Optional<Project> findById(String id);

    /**
     * Saves or updates a FileElementContainer and returns the saved instance.
     * @param element The domain object to save.
     * @return The saved domain object.
     */
    Project save(FileElementContainer<?> element);

    /**
     * Lists all projects
     * @return All projects.
     */
    List<Project> getAllProjects();
}
