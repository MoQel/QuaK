package edu.kit.quak.application.filesystem.ports.out;

import edu.kit.quak.core.filesystem.model.Project;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ProjectRepositoryPort extends FileElementContainerRepositoryPort<Project> {
    /**
     * Lists all projects owned by a specific user.
     *
     * @param ownerId The UUID of the owner
     * @return All projects belonging to the specified user.
     */
    List<Project> getProjectsByOwnerId(UUID ownerId);

    /**
     * Finds all projects with the given IDs.
     *
     * @param ids The IDs of the projects
     * @return The projects that exist
     */
    List<Project> findAllByIds(Collection<String> ids);

    /**
     * Deletes a Project by its ID.
     *
     * @param id The ID of the Project to delete.
     */
    void deleteById(String id);
}
