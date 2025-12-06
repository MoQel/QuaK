package edu.kit.quak.files.repository.savers;

import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.files.repository.FileRepository;
import edu.kit.quak.files.repository.RepoMonad;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.function.Consumer;

/**
 * Handles saving of {@link File Files}.
 *
 * @author Henrik K
 */
@Component
public class FileSaver implements FileElementSaver<File> {

    private final FileRepository repository;
    private final EntityManager manager;

    @Autowired
    public FileSaver(FileRepository repository, EntityManager manager) {
        this.repository = repository;
        this.manager = manager;
    }
    @Override
    public String getTypeIdentifier() {
        return File.TYPE_IDENTIFIER;
    }

    @Override
    public Optional<RepoMonad<?>> getRepoMonad() {
        return Optional.empty();
    }

    @Override
    public File saveNew(File element) throws IllegalArgumentException {
        element.setId(null);
        if (element.getCreatedOn() == null) {
            throw new IllegalArgumentException("createdOn must be given");
        }
        element.setLastAccess(element.getCreatedOn());
        return repository.save(element);
    }

    @Override
    public Class<File> getRelatedClass() {
        return File.class;
    }

    @Override
    public CrudRepository<File, String> getRepository() {
        return repository;
    }

    @Override
    public boolean hasElement(String id) {
        return repository.findById(id).isPresent();
    }

    @Override
    @Transactional
    public void delete(String toDelete, Consumer<String> deleter) throws IllegalArgumentException {
        File delete = repository.findById(toDelete).orElseThrow(
                () -> new IllegalArgumentException("Given id does not map to a file")
        );

        delete.getParent()
              .ifPresent(parent -> {
                  parent.removeElement(delete);
                  manager.merge(parent);
              });
        repository.delete(delete);
    }
}
