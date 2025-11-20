package edu.kit.quak.core.filesystem.ports.outgoing;

import edu.kit.quak.core.filesystem.domain.FileElement;
import edu.kit.quak.core.filesystem.domain.FileElementContainer;

import java.util.List;
import java.util.Optional;

public interface FileElementContainerRepositoryPort extends FileElementRepositoryPort {

    /**
     * Finds a FileElementContainer by its ID.
     * @param id The ID of the container.
     * @return The domain object, if found.
     */
    Optional<FileElementContainer<?>> findById(String id);

    /**
     * Saves or updates a FileElementContainer and returns the saved instance.
     * @param element The domain object to save.
     * @return The saved domain object.
     */
    FileElementContainer<?> save(FileElementContainer<?> element);

    /**
     * Finds all immediate children of a container by the container's ID.
     * Crucial for traversing the hierarchy for the deletion logic.
     * @param parentId The ID of the container (Directory or Project).
     * @return A list of immediate children (Domain POJOs).
     */
    List<FileElement<?>> findImmediateChildren(String parentId);
}
