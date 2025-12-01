package edu.kit.quak.infrastructure.filesystem.out.persistence.jpa.adapter;

import edu.kit.quak.application.filesystem.ports.outgoing.FileElementRepositoryPort;
import edu.kit.quak.infrastructure.filesystem.out.persistence.jpa.mapper.FileElementMapper;
import edu.kit.quak.infrastructure.filesystem.out.persistence.jpa.repository.SpringDataJpaFileElementRepository;

public abstract class FileElementJpaAdapter implements FileElementRepositoryPort {
    protected final SpringDataJpaFileElementRepository jpaRepository;
    protected final FileElementMapper mapper;

    protected FileElementJpaAdapter(SpringDataJpaFileElementRepository jpaRepository, FileElementMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public void deleteById(String id) {
        jpaRepository.deleteById(id);
    }

    @Override
    public boolean existsById(String id) {
        return jpaRepository.existsById(id);
    }
}
