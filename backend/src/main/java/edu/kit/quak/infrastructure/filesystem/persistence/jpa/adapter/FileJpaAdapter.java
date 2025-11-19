package edu.kit.quak.infrastructure.filesystem.persistence.jpa.adapter;

import edu.kit.quak.core.filesystem.domain.File;
import edu.kit.quak.core.filesystem.ports.outgoing.FileRepositoryPort;
import edu.kit.quak.infrastructure.filesystem.persistence.jpa.entity.JpaFile;
import edu.kit.quak.infrastructure.filesystem.persistence.jpa.mapper.FileElementMapper;
import edu.kit.quak.infrastructure.filesystem.persistence.jpa.repository.SpringDataJpaFileRepository;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
@Transactional
public class FileJpaAdapter implements FileRepositoryPort {

    private final SpringDataJpaFileRepository repository;
    private final FileElementMapper mapper;
    private final EntityManager entityManager;

    public FileJpaAdapter(SpringDataJpaFileRepository repository, FileElementMapper mapper, EntityManager entityManager) {
        this.repository = repository;
        this.mapper = mapper;
        this.entityManager = entityManager;
    }

    @Override
    public Optional<File> findById(String id) {
        return repository.findById(id).map(mapper::toDomainEntity);
    }

    @Override
    public File save(File element) {
        JpaFile entity = mapper.toJpaEntity(element);
        return mapper.toDomainEntity(repository.save(entity));
    }

    @Override
    public boolean existsById(String id) {
        return repository.existsById(id);
    }

    @Override
    public void deleteById(String id) {
        // Implementierung der alten FileSaver Logik: Parent updaten
        Optional<JpaFile> fileOpt = repository.findById(id);

        if (fileOpt.isPresent()) {
            JpaFile file = fileOpt.get();
            if (file.getParent() != null) {
                // Aus Parent-Collection entfernen
                file.getParent().getElements().remove(file);
                // Parent speichern (triggert Löschung via OrphanRemoval oder Update)
                entityManager.merge(file.getParent());
            } else {
                repository.delete(file);
            }
        }
    }

    @Override
    public Class<File> getHandledClass() {
        return File.class;
    }

    @Override
    public String getHandledTypeIdentifier() {
        return File.TYPE_IDENTIFIER;
    }
}