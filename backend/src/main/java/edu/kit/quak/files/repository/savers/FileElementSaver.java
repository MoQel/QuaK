package edu.kit.quak.files.repository.savers;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.kit.quak.files.model.FileElement;
import edu.kit.quak.files.repository.RepoMonad;
import org.springframework.data.repository.CrudRepository;

import java.util.Map;
import java.util.Optional;
import java.util.function.BiFunction;
import java.util.function.Consumer;

/**
 * A FileElementSaver handles saving of a {@link FileElement}.
 *
 * @author Henrik K
 * @param <T> The type of FileElement this saver saves.
 */
public interface FileElementSaver<T extends FileElement<T>> {

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
     * Allows for patching a {@link FileElement} stored in this saver
     * @param id The id of the element to patch
     * @param mapping A function which provides the <i>patch</i> based on two parameters: The element to patch
     *                and the class of the element to patch.
     * @return The patched element
     * @throws IllegalArgumentException If the {@code id} does not resolve or patching the element fails
     */
    default T patch(String id, BiFunction<T, Class<T>, T> mapping) throws IllegalArgumentException {
        T toPatch = getRepository().findById(id).orElseThrow(
                () -> new IllegalArgumentException("Given ID does not resolve")
        );
        T patch = mapping.apply(toPatch, getRelatedClass());
        toPatch.patch(patch);
        return getRepository().save(toPatch);
    }

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

    CrudRepository<T, String> getRepository();

    /**
     * Deletes a given element and possibly its content, depending on
     * the implementing class
     * @param toDelete The ID of the element to delete
     * @param deleter A consumer which deletes a given ID from persistent storage
     * @throws IllegalArgumentException If no element with ID {@code toDelete} could be found.
     */
    default void delete(String toDelete, Consumer<String> deleter) throws IllegalArgumentException {
        getRepository().deleteById(toDelete);
    }
}
