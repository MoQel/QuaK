package edu.kit.quak.infrastructure.filesystem.out.db.jpa;

import edu.kit.quak.application.filesystem.ports.out.FileRepositoryPort;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper.FileElementJpaMapper;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.repository.SpringDataJpaFileRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Adapter that connects the FileElementRepositoryPort (Application) to Spring Data JPA (Infrastructure).
 * The file adapter only supports read access. Save, Update and Delete operations are handled by root aggregate.
 */
@Repository
public class FileJpaAdapter implements FileRepositoryPort {
    private final SpringDataJpaFileRepository fileRepository;
    private final FileElementJpaMapper mapper;

    public FileJpaAdapter(SpringDataJpaFileRepository fileRepository, FileElementJpaMapper mapper) {
        this.fileRepository = fileRepository;
        this.mapper = mapper;
    }

    @Override
    public Optional<File> findById(String fId) {
        return fileRepository.findById(fId)
                .map(mapper::toDomainEntity);
    }

    @Override
    public boolean existsById(String id) {
        return fileRepository.existsById(id);
    }
}
