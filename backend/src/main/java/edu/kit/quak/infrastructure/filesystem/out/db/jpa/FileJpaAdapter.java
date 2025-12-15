package edu.kit.quak.infrastructure.filesystem.out.db.jpa;

import edu.kit.quak.application.filesystem.ports.out.FileRepositoryPort;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper.FileElementJpaMapper;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper.FileJpaMapper;
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
    private final FileJpaMapper fileMapper;
    private final FileElementJpaMapper elementMapper;

    public FileJpaAdapter(SpringDataJpaFileRepository fileRepository, FileJpaMapper fileMapper, FileElementJpaMapper elementMapper) {
        this.fileRepository = fileRepository;
        this.fileMapper = fileMapper;
        this.elementMapper = elementMapper;
    }

    @Override
    public Optional<File> findById(String fId) {
        String dbId = elementMapper.removePrefix(fId);
        return fileRepository.findById(dbId)
                .map(fileMapper::toDomainEntity);
    }

    @Override
    public boolean existsById(String fId) {
        String dbId = elementMapper.removePrefix(fId);
        return fileRepository.existsById(dbId);
    }
}
