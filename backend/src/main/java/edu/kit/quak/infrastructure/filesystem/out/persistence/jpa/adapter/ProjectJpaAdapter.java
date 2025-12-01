package edu.kit.quak.infrastructure.filesystem.out.persistence.jpa.adapter;

import edu.kit.quak.core.filesystem.model.FileElementContainer;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.application.filesystem.ports.outgoing.ProjectRepositoryPort;
import edu.kit.quak.infrastructure.filesystem.out.persistence.jpa.mapper.FileElementMapper;
import edu.kit.quak.infrastructure.filesystem.out.persistence.jpa.repository.SpringDataJpaFileElementRepository;

import java.util.List;
import java.util.Optional;

public class ProjectJpaAdapter extends FileElementContainerJpaAdapter implements ProjectRepositoryPort {
    public ProjectJpaAdapter(SpringDataJpaFileElementRepository jpaRepository, FileElementMapper mapper) {
        super(jpaRepository, mapper);
    }

    @Override
    public Optional<Project> findById(String id) {
        return Optional.empty();
    }

    @Override
    public Project save(FileElementContainer<?> element) {
        return null;
    }

    @Override
    public List<Project> getAllProjects() {
        return jpaRepository.findAllProjects();
    }
}
