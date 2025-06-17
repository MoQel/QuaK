package edu.kit.quak.files.repository.savers;

import edu.kit.quak.files.model.Directory;
import edu.kit.quak.files.repository.DirectoryRepository;
import edu.kit.quak.files.repository.RepoMonad;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Handles saving of {@link Directory Directories}.
 *
 * @author Henrik K
 */
@Component
public class DirectorySaver implements FileElementSaver<Directory> {

    private final DirectoryRepository repository;

    @Autowired
    public DirectorySaver(DirectoryRepository repository) {
        this.repository = repository;
    }

    @Override
    public String getTypeIdentifier() {
        return Directory.TYPE_IDENTIFIER;
    }

    @Override
    public Optional<RepoMonad<?>> getRepoMonad() {
        return Optional.of(new RepoMonad<>(repository));
    }

    @Override
    public Directory saveNew(Directory element) {
        element.setId(null);
        element.getContent().forEach(element::removeElement);
        return repository.save(element);
    }

    @Override
    public Class<Directory> getRelatedClass() {
        return Directory.class;
    }

    @Override
    public CrudRepository<Directory, String> getRepository() {
        return repository;
    }

    @Override
    public boolean hasElement(String id) {
        return repository.findById(id).isPresent();
    }
}
