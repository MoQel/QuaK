package edu.kit.quak.files.repository;

import edu.kit.quak.files.model.FileElement;
import edu.kit.quak.files.model.FileElementContainer;
import org.springframework.data.repository.CrudRepository;

// We're using this monad to ensure type safety when finding and then
// saving an element inside a repository
public class RepoMonad<T extends FileElementContainer> {
    private final CrudRepository<T, String> repo;

    public RepoMonad(CrudRepository<T, String> repo) {
        this.repo = repo;
    }

    public void addAndSave(String id, FileElement<?> element) throws IllegalArgumentException {
        T container = repo.findById(id).orElseThrow(
                () -> new IllegalArgumentException("Provided parent_id does not map to an existing element.")
        );
        container.addElement(element);
        repo.save(container);
    }
}
