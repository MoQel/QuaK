package edu.kit.quak.application.filesystem.delegator;

import edu.kit.quak.core.filesystem.model.FileElementContainer;
import java.util.Optional;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * Routes repository operations for polymorphic {@link FileElementContainer} types.
 *
 * <p>Resolves the appropriate repository via the {@link FileElementContainerRepositoryRegistry}
 * based on the ID prefix. This centralizes persistence orchestration and shields application
 * services from routing logic.
 */
@Slf4j
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
        return registry
            .<T>getRepository(prefix)
            .map(repo -> repo.save(container))
            .orElseThrow(() -> {
                log.error(
                    "Internal mapping error: No repository found for prefix '{}'. " +
                        "Check FileElementContainerRepositoryRegistry configuration.",
                    prefix
                );
                return new IllegalStateException("Missing repository for type prefix: " + prefix);
            });
    }

    public Optional<FileElementContainer<?>> findContainerById(String id) {
        if (id == null || id.isBlank()) return Optional.empty();

        char prefix = id.charAt(0);

        // Resolve repo by prefix and delegate findById call
        return registry.getRepository(prefix).flatMap(repo -> repo.findById(id).map(c -> (FileElementContainer<?>) c));
    }

    /**
     * Efficiently finds the owner ID of the root project containing the given element. Uses a
     * single database query with recursive CTE to traverse the hierarchy, avoiding N+1 queries.
     *
     * @param elementId The ID of any file element (file, directory, or project)
     * @return The UUID of the user who owns the root project
     */
    public Optional<UUID> findProjectOwnerIdByElementId(String elementId) {
        if (elementId == null || elementId.isBlank()) return Optional.empty();

        char prefix = elementId.charAt(0);

        // Use any repository that supports this query (they all delegate to the same
        // native query)
        return registry.getRepository(prefix).flatMap(repo -> repo.findProjectOwnerIdByElementId(elementId));
    }
}
