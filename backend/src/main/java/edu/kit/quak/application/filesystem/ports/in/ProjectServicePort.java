package edu.kit.quak.application.filesystem.ports.in;

import edu.kit.quak.core.filesystem.model.Project;

import java.util.List;

public interface ProjectServicePort {

    Project createProject(Project container);

    Project renameProject(String dId, String newName);

    void removeProject(String id);

    Project retrieveProject(String id);

    List<Project> listProjects();
}
