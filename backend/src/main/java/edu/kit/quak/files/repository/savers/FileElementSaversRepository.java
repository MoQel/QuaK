package edu.kit.quak.files.repository.savers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.function.Predicate;

/**
 * The FileElementSaversRepository allows for querying all
 * available {@link FileElementSaver FileElementSavers}.
 *
 * @author Henrik K
 */
@Component
public class FileElementSaversRepository {

    private final FileElementSaver<?>[] savers;

    @Autowired
    public FileElementSaversRepository(FileElementSaver<?>[] savers) {
        this.savers = savers;
    }

    /**
     * Queries the existing {@link FileElementSaver savers} by finding one which contains
     * an element with the matching {@code clazz}.
     * @param clazz The type-class to search for
     * @param filter Filters {@link FileElementSaver savers} based on their related {@link edu.kit.quak.files.model.FileElement class}
     * @return An optional of the found {@link FileElementSaver saver}.
     */
    public Optional<FileElementSaver<?>> getSaverForClass(Class<?> clazz, Class<?>... filter) {
        return getFor(saver -> saver.getRelatedClass().equals(clazz), filter);
    }

    private Optional<FileElementSaver<?>> getFor(Predicate<FileElementSaver<?>> predicate, Class<?>... filter) {
        List<Class<?>> target = Arrays.asList(filter);
        for (FileElementSaver<?> value : savers) {
            if (predicate.test(value) && (target.isEmpty() || target.contains(value.getRelatedClass()))) {
                return Optional.of(value);
            }
        }
        return Optional.empty();
    }

    /**
     * Queries the existing {@link FileElementSaver savers} by finding one which contains
     * an element with the matching {@code name}.
     * @param name The type-name to search for
     * @param filter Filters {@link FileElementSaver savers} based on their related {@link edu.kit.quak.files.model.FileElement class}
     * @return An optional of the found {@link FileElementSaver saver}.
     */
    public Optional<FileElementSaver<?>> getSaverForTypeName(String name, Class<?>... filter) {
        return getFor(saver -> saver.getTypeIdentifier().equals(name), filter);
    }

    /**
     * Queries the existing {@link FileElementSaver savers} by finding one which contains
     * an element with the matching {@code id}.
     * @param id The id to search for
     * @param filter Filters {@link FileElementSaver savers} based on their related {@link edu.kit.quak.files.model.FileElement class}
     * @return An optional of the found {@link FileElementSaver saver}.
     */
    public Optional<FileElementSaver<?>> getSaverForElementId(String id, Class<?>... filter) {
        return getFor(saver -> saver.hasElement(id), filter);
    }

    /**
     * Deletes the element with the given ID and filters the savers to use
     * @param id The ID of the element to delete
     * @param filter Filters {@link FileElementSaver savers} based on their related {@link edu.kit.quak.files.model.FileElement class}
     * @throws IllegalArgumentException If no matching saver was found or the deletion of the element failed
     */
    public void delete(String id, Class<?>... filter) throws IllegalArgumentException {
        FileElementSaver<?> saver = getSaverForElementId(id, filter)
                .orElseThrow(() -> new IllegalArgumentException("No matching saver was found"));
        saver.delete(id, this::delete);
    }
}
