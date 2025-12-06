package edu.kit.quak.application.filesystem.ports.out;

import edu.kit.quak.core.filesystem.model.File;

import java.util.Optional;

public interface FileRepositoryPort extends FileElementRepositoryPort {
    /**
     * Finds a File by its ID.
     * @param fId The ID of the file.
     * @return The domain object, if found.
     */
    Optional<File> findById(String fId);

    /**
     * Saves or updates a File and returns the saved instance.
     *
     * @param element The domain object to save.
     * @return The saved domain object.
     */
    File save(File element);

    Optional<File> rename(String fId, String newName);
}
