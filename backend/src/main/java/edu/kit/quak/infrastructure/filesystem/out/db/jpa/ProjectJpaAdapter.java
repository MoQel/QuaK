package edu.kit.quak.infrastructure.filesystem.out.db.jpa;

import edu.kit.quak.application.filesystem.ports.out.ProjectRepositoryPort;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaProject;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper.FileElementJpaMapper;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.repository.SpringDataProjectRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class ProjectJpaAdapter implements ProjectRepositoryPort {

    public final SpringDataProjectRepository repository;
    private final FileElementJpaMapper mapper;

    ProjectJpaAdapter(SpringDataProjectRepository repository, FileElementJpaMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public Optional<Project> findById(String id) {
        return repository.findById(id)
                .map(mapper::toDomainEntity);
    }

    @Override
    public Project save(Project project) {
        JpaProject jpaProject = mapper.toJpaEntity(project);
        return mapper.toDomainEntity(repository.save(jpaProject));
    }

    @Override
    public List<Project> getAllProjects() {
        return repository.findAll()
                .stream().map(mapper::toDomainEntity)
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
