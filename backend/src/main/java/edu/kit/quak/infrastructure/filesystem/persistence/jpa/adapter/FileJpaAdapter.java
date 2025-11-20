package edu.kit.quak.infrastructure.filesystem.persistence.jpa.adapter;

import edu.kit.quak.core.filesystem.domain.File;
import edu.kit.quak.core.filesystem.ports.outgoing.FileRepositoryPort;
import edu.kit.quak.infrastructure.filesystem.persistence.jpa.mapper.FileElementMapper;
import edu.kit.quak.infrastructure.filesystem.persistence.jpa.repository.SpringDataJpaFileElementRepository;
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

    // TODO implement findById & save
    public Optional<File> findById(String id) {
        return null;
    }

    @Override
    public File save(File element) {
        return null;
    }
}
