package edu.kit.quak.application.filesystem.ports.outgoing;

import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.filesystem.model.FileElementContainer;

import java.util.Optional;

public interface FileRepositoryPort extends FileElementRepositoryPort {
    /**
     * Finds a File by its ID.
     * @param id The ID of the file.
     * @return The domain object, if found.
     */
    Optional<File> findById(String id);

    /**
     * Saves or updates a File and returns the saved instance.
     * @param element The domain object to save.
     * @return The saved domain object.
     */
    File save(File element, FileElementContainer<?> parent);

    Optional<File> rename(String fId, String newName);
}
