package edu.kit.quak.infrastructure.filesystem.out.db.jpa;

import edu.kit.quak.application.filesystem.ports.out.DirectoryRepositoryPort;
import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaDirectory;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper.DirectoryJpaMapper;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper.FileElementJpaMapper;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.repository.SpringDataDirectoryRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class DirectoryJpaAdapter implements DirectoryRepositoryPort {

    SpringDataDirectoryRepository directoryRepository;
    DirectoryJpaMapper directoryMapper;
    FileElementJpaMapper elementMapper;

    public DirectoryJpaAdapter(SpringDataDirectoryRepository directoryRepository, DirectoryJpaMapper directoryMapper, FileElementJpaMapper elementMapper) {
        this.directoryRepository = directoryRepository;
        this.directoryMapper = directoryMapper;
        this.elementMapper = elementMapper;
    }

    @Override
    public Optional<Directory> findById(String dId) {
        String dbId = elementMapper.removePrefix(dId);
        return directoryRepository.findById(dbId)
                .map(directoryMapper::toDomainEntity);
    }


    @Override
    public Directory save(Directory container) {
        JpaDirectory jpaDirectory = directoryMapper.toJpaEntity(container);
        return directoryMapper.toDomainEntity(directoryRepository.save(jpaDirectory));
    }

    @Override
    public boolean existsById(String dId) {
        String dbId = elementMapper.removePrefix(dId);
        return directoryRepository.existsById(dbId);
    }
}
