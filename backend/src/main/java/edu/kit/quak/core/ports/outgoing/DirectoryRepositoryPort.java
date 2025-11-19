package edu.kit.quak.core.ports.outgoing;

import edu.kit.quak.core.domain.filesystem.Directory;

public interface DirectoryRepositoryPort extends FileElementRepositoryPort<Directory> {

    void deleteDirectoryAndContents(String id);

    void saveContainer(Directory container);
}