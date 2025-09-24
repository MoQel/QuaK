package edu.kit.quak.files.repository;

import edu.kit.quak.files.model.FileElement;
import edu.kit.quak.files.model.FileElementContainer;
import org.springframework.data.repository.CrudRepository;

/**
 * This class allows for type-safety when performing operations on an
 * unknown type of {@link CrudRepository}.
 *
 * @param <T> The type of {@link FileElementContainer} which is managed
 * by the repository given in the constructor.
 * @author Henrik K
 */
// We're using this monad to ensure type safety when finding and then
// saving an element inside a repository
public class RepoMonad<T extends FileElementContainer<?>> {
    private final CrudRepository<T, String> repo;

    public RepoMonad(CrudRepository<T, String> repo) {
        this.repo = repo;
    }

    /**
     * Adds the given {@code element} to the container with ID {@code id}
     * @param id The id of the container to store the {@code element} in.
     * @param element The element to store
     * @throws IllegalArgumentException When {@code id} could not be resolved
     */
    public FileElementContainer<?> addAndSave(String id, FileElement<?> element) throws IllegalArgumentException {
        T container = repo.findById(id).orElseThrow(
                () -> new IllegalArgumentException("Provided parent-id does not map to an existing element.")
        );
        element.setParent(container);
        repo.save(container);
        return container;
    }
}
