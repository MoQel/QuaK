package edu.kit.quak.application.filesystem.delegator;

import edu.kit.quak.application.filesystem.ports.out.FileElementContainerRepositoryPort;
import edu.kit.quak.core.filesystem.model.FileElementContainer;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * Application-layer registry for {@link FileElementContainerRepositoryPort} implementations.
 *
 * <p>Maps repositories to their unique ID prefixes to enable dynamic lookup. Ensures prefix
 * uniqueness during application startup to guarantee unambiguous routing for polymorphic domain
 * objects.
 */
@Component
public class FileElementContainerRepositoryRegistry {

    private final Map<Character, FileElementContainerRepositoryPort<?>> repoByPrefix = new HashMap<>();

    @Autowired
    public FileElementContainerRepositoryRegistry(List<FileElementContainerRepositoryPort<?>> repositories) {
        for (FileElementContainerRepositoryPort<?> repo : repositories) {
            char prefix = repo.idPrefix();

            // Guard against ambiguous prefixes
            if (repoByPrefix.put(prefix, repo) != null) {
                throw new IllegalStateException("Duplicate ID prefix '" + prefix + "'");
            }
        }
    }

    @SuppressWarnings("unchecked")
    public <T extends FileElementContainer<?>> Optional<FileElementContainerRepositoryPort<T>> getRepository(char prefix) {
        return Optional.ofNullable((FileElementContainerRepositoryPort<T>) repoByPrefix.get(prefix));
    }
}
