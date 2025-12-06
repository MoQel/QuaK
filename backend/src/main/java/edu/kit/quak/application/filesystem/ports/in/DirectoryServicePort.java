package edu.kit.quak.application.filesystem.ports.in;

import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.filesystem.model.FileElement;

import java.util.List;
import java.util.Optional;

public interface DirectoryServicePort {
    Directory createDirectory(Directory container, String parentId);

    Optional<Directory> renameDirectory(String dId, String newName);

    void removeDirectory(String id);

    Optional<Directory> retrieveDirectory(String id);

    List<FileElement<?>> listImmediateChildren(String containerId);
}
