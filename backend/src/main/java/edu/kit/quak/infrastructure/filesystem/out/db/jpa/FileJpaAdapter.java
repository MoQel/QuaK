package edu.kit.quak.infrastructure.filesystem.out.db.jpa;

import edu.kit.quak.application.filesystem.ports.out.FileRepositoryPort;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper.FileJpaMapper;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.repository.SpringDataJpaFileRepository;
import java.util.Optional;
import org.springframework.stereotype.Repository;

/**
 * Adapter that connects the FileElementRepositoryPort (Application) to Spring Data JPA
 * (Infrastructure). The file adapter only supports read access. Save, Update and Delete operations
 * are handled by root aggregate.
 */
@Repository
public class FileJpaAdapter implements FileRepositoryPort {

    private final SpringDataJpaFileRepository fileRepository;
    private final FileJpaMapper fileMapper;

    public FileJpaAdapter(SpringDataJpaFileRepository fileRepository, FileJpaMapper fileMapper) {
        this.fileRepository = fileRepository;
        this.fileMapper = fileMapper;
    }

    @Override
    public Optional<File> findById(String fId) {
        return fileRepository.findById(fId).map(fileMapper::toDomainEntity);
    }

    @Override
    public boolean existsById(String fId) {
        return fileRepository.existsById(fId);
    }
}
