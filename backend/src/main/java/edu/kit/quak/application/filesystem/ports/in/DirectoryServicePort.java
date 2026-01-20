package edu.kit.quak.application.filesystem.ports.in;

import edu.kit.quak.core.filesystem.model.Directory;

public interface DirectoryServicePort {
    Directory createDirectory(Directory container, String parentId);

    Directory renameDirectory(String dId, String newName);

    void removeDirectory(String id);

    Directory retrieveDirectory(String id);
}
