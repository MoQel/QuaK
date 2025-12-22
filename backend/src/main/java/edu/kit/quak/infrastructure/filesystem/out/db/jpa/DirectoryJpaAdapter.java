package edu.kit.quak.infrastructure.filesystem.out.db.jpa;

import edu.kit.quak.application.filesystem.ports.out.DirectoryRepositoryPort;
import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaDirectory;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaFileElementContainer;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper.DirectoryJpaMapper;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.repository.SpringDataDirectoryRepository;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.repository.SpringDataFileElementContainerRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public class DirectoryJpaAdapter implements DirectoryRepositoryPort {

    SpringDataDirectoryRepository directoryRepository;
    SpringDataFileElementContainerRepository parentRepository;
    DirectoryJpaMapper directoryMapper;

    public DirectoryJpaAdapter(SpringDataDirectoryRepository directoryRepository, DirectoryJpaMapper directoryMapper,
            SpringDataFileElementContainerRepository parentRepository) {
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
        return directoryRepository.findById(dId)
                .map(directoryMapper::toDomainEntity);
    }

    @Override
    public Directory save(Directory container) {
        JpaDirectory jpaDirectory = directoryMapper.toJpaEntity(container);
        // We need to set the parent of container manually because it is ignored by the
        // mapping
        // else we would lose the bidirectional behavior in the db
        if (container.getParentId() != null) {
            JpaFileElementContainer<?> parent = parentRepository.findById(container.getParentId())
                    .orElseThrow(() -> new IllegalArgumentException("Parent not found: " + container.getParentId()));
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
        return parentRepository.findProjectOwnerIdByElementId(elementId)
                .map(this::convertToUuid);
    }

    /**
     * Converts the raw database value to UUID.
     * H2 may return byte[], MariaDB may return UUID or String.
     */
    private UUID convertToUuid(Object value) {
        if (value instanceof UUID) {
            return (UUID) value;
        } else if (value instanceof byte[]) {
            // H2 returns UUID as byte array
            byte[] bytes = (byte[]) value;
            java.nio.ByteBuffer bb = java.nio.ByteBuffer.wrap(bytes);
            return new UUID(bb.getLong(), bb.getLong());
        } else if (value instanceof String) {
            return UUID.fromString((String) value);
        }
        throw new IllegalArgumentException("Cannot convert value to UUID: " + value.getClass());
    }
}
