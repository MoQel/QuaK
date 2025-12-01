package edu.kit.quak.infrastructure.filesystem.out.persistence.jpa.adapter;

import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.filesystem.model.FileElementContainer;
import edu.kit.quak.application.filesystem.ports.outgoing.DirectoryRepositoryPort;
import edu.kit.quak.infrastructure.filesystem.out.persistence.jpa.mapper.FileElementMapper;
import edu.kit.quak.infrastructure.filesystem.out.persistence.jpa.repository.SpringDataJpaFileElementRepository;

import java.util.Optional;

public class DirectoryJpaAdapter extends FileElementContainerJpaAdapter implements DirectoryRepositoryPort {
    public DirectoryJpaAdapter(SpringDataJpaFileElementRepository jpaRepository, FileElementMapper mapper) {
        super(jpaRepository, mapper);
    }

    @Override
    public Optional<Directory> findById(String id) {
        return Optional.empty();
    }

    @Override
    public Directory save(FileElementContainer<?> element) {
        return null;
    }
}
