package edu.kit.quak.infrastructure.filesystem.persistence.jpa.adapter;


import edu.kit.quak.core.filesystem.domain.Project;
import edu.kit.quak.core.filesystem.ports.outgoing.ProjectRepositoryPort;
import edu.kit.quak.infrastructure.filesystem.persistence.jpa.entity.JpaFileElement;
import edu.kit.quak.infrastructure.filesystem.persistence.jpa.entity.JpaProject;
import edu.kit.quak.infrastructure.filesystem.persistence.jpa.mapper.FileElementMapper;
import edu.kit.quak.infrastructure.filesystem.persistence.jpa.repository.SpringDataJpaProjectRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
@Transactional
public class ProjectJpaAdapter implements ProjectRepositoryPort {

    private final SpringDataJpaProjectRepository repository;
    private final FileElementMapper mapper;

    public ProjectJpaAdapter(SpringDataJpaProjectRepository repository, FileElementMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public Optional<Project> findById(String id) {
        return repository.findById(id).map(mapper::toDomainEntity);
    }

    @Override
    public Project save(Project element) {
        JpaProject entity = mapper.toJpaEntity(element);
        linkChildrenToParent(entity);
        return mapper.toDomainEntity(repository.save(entity));
    }

    @Override
    public boolean existsById(String id) {
        return repository.existsById(id);
    }

    @Override
    public void deleteById(String id) {
        repository.deleteById(id);
    }

    @Override
    public Class<Project> getHandledClass() {
        return Project.class;
    }

    @Override
    public String getHandledTypeIdentifier() {
        return Project.TYPE_IDENTIFIER;
    }

    private void linkChildrenToParent(JpaProject project) {
        if (project.getContents() != null) {
            for (JpaFileElement<?> child : project.getContents()) {
                child.setParent(project);
            }
        }
    }
}
