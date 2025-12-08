package edu.kit.quak.application.filesystem.ports.in;

import edu.kit.quak.core.filesystem.model.Project;

import java.util.List;
import java.util.Optional;

public interface ProjectServicePort {

    Project createProject(Project container);

    Optional<Project> renameProject(String dId, String newName);

    void removeProject(String id);

    Optional<Project> retrieveProject(String id);

    List<Project> listProjects();
}
