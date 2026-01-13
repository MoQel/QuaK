package edu.kit.quak.application.filesystem.ports.out;

import java.util.Optional;

public interface FileContentRepositoryPort {
    /**
     * Saves the content of a file.
     *
     * @param fId ID of the file
     * @param content Updated Content
     */
    void saveContent(String fId, byte[] content);

    /**
     * Loads the content of a file.
     * @param fId ID of the file
     * @return byte array of content
     */
    Optional<byte[]> loadContent(String fId);

    /**
     * Deletes the content of a file.
     * @param fId ID of the file
     */
    void deleteContent(String fId);
}
