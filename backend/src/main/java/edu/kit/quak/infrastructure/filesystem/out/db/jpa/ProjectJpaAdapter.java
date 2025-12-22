package edu.kit.quak.infrastructure.filesystem.out.db.jpa;

import edu.kit.quak.application.filesystem.ports.out.ProjectRepositoryPort;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaProject;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper.ProjectJpaMapper;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.repository.SpringDataFileElementContainerRepository;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.repository.SpringDataProjectRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class ProjectJpaAdapter implements ProjectRepositoryPort {

    private final SpringDataProjectRepository repository;
    private final SpringDataFileElementContainerRepository containerRepository;
    private final ProjectJpaMapper projectMapper;

    ProjectJpaAdapter(SpringDataProjectRepository repository,
            SpringDataFileElementContainerRepository containerRepository,
            ProjectJpaMapper projectMapper) {
        this.repository = repository;
        this.containerRepository = containerRepository;
        this.projectMapper = projectMapper;
    }

    @Override
    public char idPrefix() {
        return Project.ID_PREFIX;
    }

    @Override
    public Optional<Project> findById(String pId) {
        return repository.findById(pId)
                .map(projectMapper::toDomainEntity);
    }

    @Override
    public Project save(Project project) {
        // We do not need to set parent here, project has no parent
        JpaProject jpaProject = projectMapper.toJpaEntity(project);
        return projectMapper.toDomainEntity(repository.save(jpaProject));
    }

    @Override
    public List<Project> getProjectsByOwnerId(UUID ownerId) {
        return repository.findAllByOwnerId(ownerId)
                .stream().map(projectMapper::toDomainEntity)
                .toList();
    }

    @Override
    public void deleteById(String pId) {
        repository.deleteById(pId);
    }

    @Override
    public boolean existsById(String pId) {
        return repository.existsById(pId);
    }

    @Override
    public Optional<UUID> findProjectOwnerIdByElementId(String elementId) {
        return containerRepository.findProjectOwnerIdByElementId(elementId)
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
