package edu.kit.quak.infrastructure.filesystem.out.db.jpa;

import edu.kit.quak.application.filesystem.ports.out.DirectoryRepositoryPort;
import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaDirectory;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaFileElementContainer;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper.DirectoryJpaMapper;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.repository.SpringDataDirectoryRepository;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.repository.SpringDataFileElementContainerRepository;
import java.util.Optional;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

@Slf4j
@Repository
public class DirectoryJpaAdapter implements DirectoryRepositoryPort {

    SpringDataDirectoryRepository directoryRepository;
    SpringDataFileElementContainerRepository parentRepository;
    DirectoryJpaMapper directoryMapper;

    public DirectoryJpaAdapter(
        SpringDataDirectoryRepository directoryRepository,
        DirectoryJpaMapper directoryMapper,
        SpringDataFileElementContainerRepository parentRepository
    ) {
        this.directoryRepository = directoryRepository;
        this.directoryMapper = directoryMapper;
        this.parentRepository = parentRepository;
    }

    @Override
    public char idPrefix() {
        return Directory.ID_PREFIX;
    }

    @Override
    public Optional<Directory> findById(String dId) {
        return directoryRepository.findById(dId).map(directoryMapper::toDomainEntity);
    }

    @Override
    public Directory save(Directory container) {
        JpaDirectory jpaDirectory = directoryMapper.toJpaEntity(container);
        // We need to set the parent of container manually because it is ignored by the
        // mapping
        // else we would lose the bidirectional behavior in the db
        if (container.getParentId() != null) {
            JpaFileElementContainer<?> parent = parentRepository
                .findById(container.getParentId())
                .orElseThrow(() -> {
                    log.error("Data inconsistency: Parent not found in DB during directory save. parentId={}", container.getParentId());
                    return new IllegalStateException("Parent container missing during save operation");
                });
            jpaDirectory.setParent(parent);
        }
        return directoryMapper.toDomainEntity(directoryRepository.save(jpaDirectory));
    }

    @Override
    public boolean existsById(String dId) {
        return directoryRepository.existsById(dId);
    }

    @Override
    public Optional<UUID> findProjectOwnerIdByElementId(String elementId) {
        return parentRepository.findProjectOwnerIdByElementId(elementId).map(JpaUtils::convertToUuid);
    }

    @Override
    public Optional<String> findProjectIdByElementId(String elementId) {
        return parentRepository.findProjectIdByElementId(elementId);
    }
}
