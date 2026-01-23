package edu.kit.quak.application.filesystem.ports.in;

import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.user.model.User;

public interface DirectoryServicePort {
    Directory createDirectory(Directory container, String parentId, User user);

    Directory renameDirectory(String dId, String newName, User user);

    void removeDirectory(String id, User user);

    Directory retrieveDirectory(String id, User user);
}
