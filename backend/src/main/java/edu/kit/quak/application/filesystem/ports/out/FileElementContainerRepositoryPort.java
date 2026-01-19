package edu.kit.quak.application.filesystem.ports.out;

import edu.kit.quak.core.filesystem.model.FileElementContainer;

import java.util.Optional;

/**
 * Repository port for {@link FileElementContainer} aggregates.
 * <p>
 * Each implementation is responsible for exactly one container definitionId and
 * must declare the ID prefix it manages. The prefix is used to route
 * persistence operations to the correct repository.
 *
 * @param <T> the concrete container aggregate definitionId
 */
public interface FileElementContainerRepositoryPort<T extends FileElementContainer<?>> extends FileElementRepositoryPort {

    /**
     * Returns the unique ID prefix handled by this repository.
     *
     * @return the ID prefix
     */
    char idPrefix();

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
