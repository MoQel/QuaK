package edu.kit.quak.core.ports.incoming;

import edu.kit.quak.core.domain.filesystem.FileElement;

import java.util.Map;
import java.util.function.BiFunction;

/**
 * A port that orchestrates the retrieval and storage of FileElements based on type.
 */
public interface FileElementAccessPort {

    void deleteElementById(String id) throws IllegalArgumentException;

    <T extends FileElement<T>> T patch(String id, BiFunction<T, Class<T>, T> mapping) throws IllegalArgumentException;

    FileElement<?> saveNewElement(Map<String, Object> elementData) throws IllegalArgumentException;

    boolean elementExists(String id);
}