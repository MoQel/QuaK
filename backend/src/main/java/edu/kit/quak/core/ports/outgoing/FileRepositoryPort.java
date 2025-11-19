package edu.kit.quak.core.ports.outgoing;

import edu.kit.quak.core.domain.filesystem.File;

public interface FileRepositoryPort extends FileElementRepositoryPort<File> {

    void deleteFileAndUpdateParent(String id);
}