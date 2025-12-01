package edu.kit.quak.application.filesystem.ports.outgoing;

import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.filesystem.model.FileElementContainer;

import java.util.Optional;

public interface DirectoryRepositoryPort extends FileElementContainerRepositoryPort {
    /**
     * Finds a FileElementContainer by its ID.
     * @param id The ID of the container.
     * @return The domain object, if found.
     */
    Optional<Directory> findById(String id);

    /**
     * Saves or updates a FileElementContainer and returns the saved instance.
     * @param element The domain object to save.
     * @return The saved domain object.
     */
    Directory save(FileElementContainer<?> element);

}
