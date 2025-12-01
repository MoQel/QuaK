package edu.kit.quak.infrastructure.filesystem.out.persistence.jpa.adapter;

import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.filesystem.model.FileElementContainer;
import edu.kit.quak.application.filesystem.ports.outgoing.FileRepositoryPort;
import edu.kit.quak.infrastructure.filesystem.out.persistence.jpa.mapper.FileElementMapper;
import edu.kit.quak.infrastructure.filesystem.out.persistence.jpa.repository.SpringDataJpaFileElementRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Adapter that connects the FileElementRepositoryPort (Application) to Spring Data JPA (Infrastructure).
 */
@Component
public class FileJpaAdapter extends FileElementJpaAdapter implements FileRepositoryPort {

    public FileJpaAdapter(SpringDataJpaFileElementRepository jpaRepository, FileElementMapper mapper) {
        super(jpaRepository, mapper);
    }

    // TODO implement findById & save & rename
    @Override
    public Optional<File> findById(String id) {
        return Optional.empty();
    }

    @Override
    public File save(File element, FileElementContainer<?> parent) {
        return null;
    }

    @Override
    public Optional<File> rename(String fId, String  newName) {
        return Optional.empty();
    }
}
