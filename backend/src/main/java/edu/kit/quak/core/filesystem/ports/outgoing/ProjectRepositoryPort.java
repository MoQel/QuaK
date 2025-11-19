package edu.kit.quak.core.filesystem.ports.outgoing;

import edu.kit.quak.core.filesystem.domain.Project;

public interface ProjectRepositoryPort extends FileElementRepositoryPort<Project> {

    void saveContainer(Project container);
}