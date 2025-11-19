package edu.kit.quak.core.ports.outgoing;

import edu.kit.quak.core.domain.filesystem.Project;

public interface ProjectRepositoryPort extends FileElementRepositoryPort<Project> {

    void saveContainer(Project container);
}