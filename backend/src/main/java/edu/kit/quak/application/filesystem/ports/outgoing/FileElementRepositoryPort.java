package edu.kit.quak.application.filesystem.ports.outgoing;

/**
 * Port to manage FileElements (including File, Directory, Project) persistence.
 * This interface is used by Application Services and implemented by a JPA Adapter.
 */
public interface FileElementRepositoryPort {

    /**
     * Deletes a FileElement by its ID.
     * @param id The ID of the element to delete.
     */
    void deleteById(String id);

    /**
     * Search a FileElement by its ID.
     * @param id The ID of the element to delete.
     * @return Whether the element exists.
     */
    boolean existsById(String id);
}
