package edu.kit.quak.application.filesystem.ports.out;

import edu.kit.quak.core.filesystem.model.FileElementContainer;

import java.util.Optional;

public interface FileElementContainerRepositoryPort<T extends FileElementContainer<?>> extends FileElementRepositoryPort {

    /**
     * Finds a Project or Directory by its ID.
     * @param id The ID of the container.
     * @return The Project or Directory domain object, if found.
     */
    Optional<T> findById(String id);

    /**
     * Saves a Project or Directory container.
     * @param container Container to save.
     * @return The saved container.
     */
    T save(T container);
}
