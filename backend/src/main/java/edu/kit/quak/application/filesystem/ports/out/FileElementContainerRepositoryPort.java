package edu.kit.quak.application.filesystem.ports.out;

import edu.kit.quak.core.filesystem.model.FileElement;
import edu.kit.quak.core.filesystem.model.FileElementContainer;

import java.util.List;
import java.util.Optional;

public interface FileElementContainerRepositoryPort<T extends FileElementContainer<?>> extends FileElementRepositoryPort {

    /**
     * Finds all immediate children of a container by the container's ID.
     * Crucial for traversing the hierarchy for the deletion logic.
     * @param parentId The ID of the container (Directory or Project).
     * @return A list of immediate children (Domain POJOs).
     */
    List<FileElement<?>> findImmediateChildren(String parentId);

    /**
     * Finds a FileElementContainer by its ID.
     * @param id The ID of the container.
     * @return The FileElementContainer domain object, if found.
     */
    Optional<FileElementContainer<?>> findContainerById(String id);

    /**
     * Finds a Project or Directory by its ID.
     * @param id The ID of the container.
     * @return The Project or Directory domain object, if found.
     */
    Optional<T> findById(String id);

    T save(T container);

    /**
     * Deletes a FileElementContainer by its ID.
     * @param id The ID of the element to delete.
     */
    void deleteById(String id);
}
