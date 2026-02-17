package edu.kit.quak.infrastructure.user.out.db.jpa;

import edu.kit.quak.application.user.ports.out.ProjectRoleRepositoryPort;
import edu.kit.quak.core.user.model.ProjectRole;
import edu.kit.quak.core.user.model.ProjectRoleAssignment;
import edu.kit.quak.infrastructure.user.out.db.jpa.entity.JpaProjectRoleAssignment;
import edu.kit.quak.infrastructure.user.out.db.jpa.mapper.ProjectRoleJpaMapper;
import edu.kit.quak.infrastructure.user.out.db.jpa.repository.SpringDataProjectRoleRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

/**
 * JPA adapter implementing ProjectRoleRepositoryPort. This adapter translates
 * domain operations to
 * JPA operations.
 */
@Repository
public class ProjectRoleJpaAdapter implements ProjectRoleRepositoryPort {

    private final SpringDataProjectRoleRepository repository;
    private final ProjectRoleJpaMapper mapper;

    public ProjectRoleJpaAdapter(SpringDataProjectRoleRepository repository, ProjectRoleJpaMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public ProjectRoleAssignment save(ProjectRoleAssignment assignment) {
        JpaProjectRoleAssignment jpa = mapper.toJpa(assignment);
        JpaProjectRoleAssignment saved = repository.save(jpa);
        return mapper.toDomain(saved);
    }

    @Override
    public Optional<ProjectRoleAssignment> findByUserIdAndProjectId(UUID userId, String projectId) {
        return repository.findByUserIdAndProjectId(userId, projectId).map(mapper::toDomain);
    }

    @Override
    public List<ProjectRoleAssignment> findAllByProjectId(String projectId) {
        return repository.findAllByProjectId(projectId).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public List<ProjectRoleAssignment> findAllByUserId(UUID userId) {
        return repository.findAllByUserId(userId).stream().map(mapper::toDomain).toList();
    }

    @Override
    public List<ProjectRoleAssignment> findAllByUserIdAndRole(UUID userId, ProjectRole role) {
        return repository.findAllByUserIdAndRole(userId, role).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public void deleteByUserIdAndProjectId(UUID userId, String projectId) {
        repository.deleteByUserIdAndProjectId(userId, projectId);
    }

    @Override
    public void deleteAllByProjectId(String projectId) {
        repository.deleteAllByProjectId(projectId);
    }
}
