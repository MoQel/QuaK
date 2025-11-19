package edu.kit.quak.core.filesystem.ports.outgoing;

import edu.kit.quak.core.filesystem.domain.Directory;

public interface DirectoryRepositoryPort extends FileElementRepositoryPort<Directory> {

    void deleteDirectoryAndContents(String id);

    void saveContainer(Directory container);
}