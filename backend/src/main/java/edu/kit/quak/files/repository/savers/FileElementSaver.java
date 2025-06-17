package edu.kit.quak.files.repository.savers;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.kit.quak.files.model.FileElement;
import edu.kit.quak.files.repository.RepoMonad;

import java.util.Map;
import java.util.Optional;

/**
 * A FileElementSaver handles saving of a {@link FileElement}.
 *
 * @author Henrik K
 * @param <T> The type of FileElement this saver saves.
 */
public interface FileElementSaver<T extends FileElement<?>> {

    /**
     * @return The type identifier of {@link T the FileElement}
     */
    String getTypeIdentifier();

    /**
     * If {@link T the FileElement} is a {@link edu.kit.quak.files.model.FileElementContainer},
     * constructs the RepoMonad
     * @return The RepoMonad, else empty
     */
    Optional<RepoMonad<?>> getRepoMonad();

    /**
     * Handles saving {@link T the FileElement}.
     * @param element The element to save
     * @throws IllegalArgumentException if the given element has an illegal state
     * @return The result of saving the {@code element}
     */
    T saveNew(T element) throws IllegalArgumentException;

    /**
     * Maps the given object and {@link #saveNew(FileElement) saves} it.
     * @param mapper The mapper to map the {@code object} to type {@link T}
     * @param object The object to map
     * @return The newly saved element
     */
    default T mapAndSaveNew(ObjectMapper mapper, Map<String, Object> object) {
        T element = mapper.convertValue(object, getRelatedClass());
        return saveNew(element);
    }

    /**
     * Checks if an element of type {@link T} exists with the given {@code id}.
     * @param id The id of the target
     * @return {@code true} if an element with {@code id} exists
     */
    boolean hasElement(String id);

    /**
     * @return The class of {@link T}
     */
    Class<T> getRelatedClass();
}
