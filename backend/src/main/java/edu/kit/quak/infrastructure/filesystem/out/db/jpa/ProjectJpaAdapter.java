package edu.kit.quak.infrastructure.filesystem.out.db.jpa;

import edu.kit.quak.application.filesystem.ports.out.ProjectRepositoryPort;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaProject;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper.ProjectJpaMapper;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.repository.SpringDataProjectRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class ProjectJpaAdapter implements ProjectRepositoryPort {

    public final SpringDataProjectRepository repository;
    private final ProjectJpaMapper projectMapper;

    ProjectJpaAdapter(SpringDataProjectRepository repository, ProjectJpaMapper projectMapper) {
        this.repository = repository;
        this.projectMapper = projectMapper;
    }

    @Override
    public Optional<Project> findById(String id) {
        return repository.findById(id)
                .map(projectMapper::toDomainEntity);
    }

    @Override
    public Project save(Project project) {
        JpaProject jpaProject = projectMapper.toJpaEntity(project);
        return projectMapper.toDomainEntity(repository.save(jpaProject));
    }

    @Override
    public List<Project> getAllProjects() {
        return repository.findAll()
                .stream().map(projectMapper::toDomainEntity)
                .toList();
    }

    @Override
    public void deleteById(String id) {
        repository.deleteById(id);
    }

    @Override
    public boolean existsById(String id) {
        return repository.existsById(id);
    }
}
