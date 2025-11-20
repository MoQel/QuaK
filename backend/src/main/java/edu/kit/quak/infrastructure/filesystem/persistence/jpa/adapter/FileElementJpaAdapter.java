package edu.kit.quak.infrastructure.filesystem.persistence.jpa.adapter;

import edu.kit.quak.core.filesystem.ports.outgoing.FileElementRepositoryPort;
import edu.kit.quak.infrastructure.filesystem.persistence.jpa.mapper.FileElementMapper;
import edu.kit.quak.infrastructure.filesystem.persistence.jpa.repository.SpringDataJpaFileElementRepository;

public abstract class FileElementJpaAdapter implements FileElementRepositoryPort {
    protected final SpringDataJpaFileElementRepository jpaRepository;
    protected final FileElementMapper mapper;

    protected FileElementJpaAdapter(SpringDataJpaFileElementRepository jpaRepository, FileElementMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    public void deleteById(String id) {
        jpaRepository.deleteById(id);
    }

    public boolean existsById(String id) {
        return jpaRepository.existsById(id);
    }
}
