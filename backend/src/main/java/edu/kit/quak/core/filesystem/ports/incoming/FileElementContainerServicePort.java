package edu.kit.quak.core.filesystem.ports.incoming;

import edu.kit.quak.core.filesystem.domain.FileElementContainer;
import edu.kit.quak.core.filesystem.domain.Project;

import java.util.List;
import java.util.Optional;

public interface FileElementContainerServicePort {

    List<Project> listProjects();

    FileElementContainer<?> create(FileElementContainer<?> container, String parentId);

    FileElementContainer<?> update(FileElementContainer<?> container);

    void delete(String id);

    Optional<FileElementContainer<?>> get(String id);

    List<?> listImmediateChildren(String containerId);
}

