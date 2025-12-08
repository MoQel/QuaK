package edu.kit.quak.infrastructure.filesystem.out.db.jpa;

import edu.kit.quak.application.filesystem.ports.out.DirectoryRepositoryPort;
import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaDirectory;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper.FileElementJpaMapper;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.repository.SpringDataDirectoryRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class DirectoryJpaAdapter implements DirectoryRepositoryPort {

    SpringDataDirectoryRepository directoryRepository;
    FileElementJpaMapper mapper;

    public DirectoryJpaAdapter(SpringDataDirectoryRepository directoryRepository, FileElementJpaMapper mapper) {
        this.directoryRepository = directoryRepository;
        this.mapper = mapper;
    }

    @Override
    public Optional<Directory> findById(String dId) {
        return directoryRepository.findById(dId)
                .map(mapper::toDomainEntity);
    }


    @Override
    public Directory save(Directory container) {
        JpaDirectory jpaDirectory = mapper.toJpaEntity(container);
        return mapper.toDomainEntity(directoryRepository.save(jpaDirectory));
    }

    @Override
    public boolean existsById(String dId) {
        return directoryRepository.existsById(dId);
    }
}
