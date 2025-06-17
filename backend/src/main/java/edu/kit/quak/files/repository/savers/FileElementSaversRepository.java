package edu.kit.quak.files.repository.savers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

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

    public Optional<FileElementSaver<?>> getSaverForClass(Class<?> clazz) {
        return getFor(saver -> saver.getRelatedClass().equals(clazz));
    }

    private Optional<FileElementSaver<?>> getFor(Predicate<FileElementSaver<?>> predicate) {
        for (FileElementSaver<?> value : savers) {
            if (predicate.test(value)) {
                return Optional.of(value);
            }
        }
        return Optional.empty();
    }

    public Optional<FileElementSaver<?>> getSaverForTypeName(String name) {
        return getFor(saver -> saver.getTypeIdentifier().equals(name));
    }

    /**
     * Queries the existing {@link FileElementSaver savers} by finding one which contains
     * an element with the matching {@code id}.
     * @param id The id to search for
     * @return An optional of the found {@link FileElementSaver saver}.
     */
    public Optional<FileElementSaver<?>> getSaverForElementId(String id) {
        return getFor(saver -> saver.hasElement(id));
    }

    public void delete(String id) {
        getSaverForElementId(id).ifPresent(saver -> saver.delete(id, this::delete));
    }
}
