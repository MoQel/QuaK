package edu.kit.quak.application.filesystem.delegator;

import edu.kit.quak.core.filesystem.model.FileElementContainer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Routes repository operations for polymorphic {@link FileElementContainer} types.
 * <p>
 * Resolves the appropriate repository via the {@link FileElementContainerRepositoryRegistry}
 * based on the ID prefix. This centralizes persistence orchestration and shields
 * application services from routing logic.
 * </p>
 */
@Component
public class FileElementContainerRepositoryDelegator {

    private final FileElementContainerRepositoryRegistry registry;

    @Autowired
    public FileElementContainerRepositoryDelegator(FileElementContainerRepositoryRegistry registry) {
        this.registry = registry;
    }

    public <T extends FileElementContainer<?>> T save(T container) {
        if (container == null) return null;

        char prefix = container.getIdPrefix();

        // Use registry to find the matching repository
        return registry.<T>getRepository(prefix)
                .map(repo -> repo.save(container))
                .orElseThrow(() -> new IllegalArgumentException("No repo for prefix: " + prefix));
    }

    public Optional<FileElementContainer<?>> findContainerById(String id) {
        if (id == null || id.isBlank()) return Optional.empty();

        char prefix = id.charAt(0);

        // Resolve repo by prefix and delegate findById call
        return registry.getRepository(prefix)
                .flatMap(repo -> repo.findById(id).map(c -> (FileElementContainer<?>) c));
    }
}