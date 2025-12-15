package edu.kit.quak.application.filesystem.delegator;

import edu.kit.quak.application.filesystem.ports.out.FileElementContainerRepositoryPort;
import edu.kit.quak.core.filesystem.model.FileElementContainer;
import org.springframework.aop.support.AopUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.GenericTypeResolver;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
public class FileElementContainerRepositoryDelegator {

    private final Map<Class<?>, FileElementContainerRepositoryPort<?>> repoByType = new HashMap<>();
    private final Map<Character, FileElementContainerRepositoryPort<?>> repoByPrefix = new HashMap<>();

    @Autowired
    public FileElementContainerRepositoryDelegator(List<FileElementContainerRepositoryPort<?>> repositories) {

        for (FileElementContainerRepositoryPort<?> repo : repositories) {

            Class<?> targetClass = AopUtils.getTargetClass(repo);

            // Generic type extraction (Project, Directory, File, ...)
            Class<?> entityType = GenericTypeResolver.resolveTypeArgument(
                    targetClass,
                    FileElementContainerRepositoryPort.class
            );

            if (entityType == null) {
                throw new IllegalStateException(
                        "Could not resolve generic type for repository: " + repo.getClass()
                );
            }

            // Build Class → Repo mapping
            if (repoByType.put(entityType, repo) != null) {
                throw new IllegalStateException("Duplicate repository for type " + entityType.getName());
            }

            // Build Prefix → Repo mapping
            try {
                var constructor = entityType.getDeclaredConstructor();
                constructor.setAccessible(true);
                char prefix = ((FileElementContainer<?>) constructor.newInstance()).getIdPrefix();

                if (repoByPrefix.put(prefix, repo) != null) {
                    throw new IllegalStateException(
                            "Duplicate ID prefix '" + prefix + "' for repositories!"
                    );
                }

            } catch (Exception e) {
                throw new IllegalStateException(
                        "Could not instantiate container class " + entityType.getName() +
                                " to determine ID prefix.", e
                );
            }
        }
    }

    @SuppressWarnings("unchecked")
    public <T extends FileElementContainer<?>> T save(T container) {
        if (container == null) return null;

        FileElementContainerRepositoryPort<T> repo =
                (FileElementContainerRepositoryPort<T>) repoByType.get(container.getClass());

        if (repo == null) {
            throw new IllegalArgumentException(
                    "No repository registered for type " + container.getClass().getName()
            );
        }

        return repo.save(container);
    }

    public Optional<FileElementContainer<?>> findContainerById(String id) {
        if (id == null || id.isBlank()) return Optional.empty();

        char prefix = id.charAt(0);

        FileElementContainerRepositoryPort<?> repo = repoByPrefix.get(prefix);

        if (repo == null) {
            return Optional.empty(); // No repo for this prefix
        }

        return repo.findById(id).map(c -> (FileElementContainer<?>) c);
    }
}