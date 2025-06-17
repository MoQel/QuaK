package edu.kit.quak.files.repository.savers;

import edu.kit.quak.files.model.File;
import edu.kit.quak.files.repository.FileRepository;
import edu.kit.quak.files.repository.RepoMonad;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Handles saving of {@link File Files}.
 *
 * @author Henrik K
 */
@Component
public class FileSaver implements FileElementSaver<File> {

    private final FileRepository repository;

    @Autowired
    public FileSaver(FileRepository repository) {
        this.repository = repository;
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
    public File saveNew(File element) {
        element.setId(null);
        return repository.save(element);
    }

    @Override
    public Class<File> getRelatedClass() {
        return File.class;
    }

    @Override
    public boolean hasElement(String id) {
        return repository.findById(id).isPresent();
    }
}
