package edu.kit.quak.application.filesystem.ports.out;

import edu.kit.quak.core.filesystem.model.FileElementContainer;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository port for {@link FileElementContainer} aggregates. <<<<<<< HEAD
 *
 * <p>Each implementation is responsible for exactly one container type and must declare the ID
 * prefix it manages. The prefix is used to route persistence operations to the correct repository.
 *
 * @param <T> the concrete container aggregate type
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
     *
     * @param id The ID of the container.
     * @return The Project or Directory domain object, if found.
     */
    Optional<T> findById(String id);

    /**
     * Saves a Project or Directory container.
     *
     * @param container Container to save.
     * @return The saved container.
     */
    T save(T container);

    /**
     * Finds the owner ID of the root project containing the given element. This method traverses
     * the hierarchy upward to find the root project in a single efficient database query.
     *
     * @param elementId The ID of any file element (file, directory, or project)
     * @return The UUID of the user who owns the root project, if found
     */
    Optional<UUID> findProjectOwnerIdByElementId(String elementId);
}
