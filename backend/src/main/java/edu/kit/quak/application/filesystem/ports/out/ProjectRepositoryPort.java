package edu.kit.quak.application.filesystem.ports.out;

import edu.kit.quak.core.filesystem.model.Project;

import java.util.List;

public interface ProjectRepositoryPort extends FileElementContainerRepositoryPort<Project> {

    /**
     * Lists all projects
     * @return All projects.
     */
    List<Project> getAllProjects();

    /**
     * Deletes a Project by its ID.
     * @param id The ID of the Project to delete.
     */
    void deleteById(String id);
}
