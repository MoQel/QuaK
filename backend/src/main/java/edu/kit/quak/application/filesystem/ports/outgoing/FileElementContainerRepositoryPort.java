package edu.kit.quak.application.filesystem.ports.outgoing;

import edu.kit.quak.core.filesystem.model.FileElement;
import edu.kit.quak.core.filesystem.model.FileElementContainer;

import java.util.List;
import java.util.Optional;

public interface FileElementContainerRepositoryPort extends FileElementRepositoryPort {

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
     * @return The domain object, if found.
     */
    Optional<FileElementContainer<?>> findContainerById(String id);
}
