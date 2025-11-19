package edu.kit.quak.infrastructure.filesystem.persistence.jpa.adapter;

import edu.kit.quak.core.filesystem.domain.Directory;
import edu.kit.quak.core.filesystem.ports.outgoing.DirectoryRepositoryPort;
import edu.kit.quak.infrastructure.filesystem.persistence.jpa.entity.JpaDirectory;
import edu.kit.quak.infrastructure.filesystem.persistence.jpa.entity.JpaFileElement;
import edu.kit.quak.infrastructure.filesystem.persistence.jpa.mapper.FileElementMapper;
import edu.kit.quak.infrastructure.filesystem.persistence.jpa.repository.SpringDataJpaDirectoryRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
@Transactional
public class DirectoryJpaAdapter implements DirectoryRepositoryPort {

    private final SpringDataJpaDirectoryRepository repository;
    private final FileElementMapper mapper;

    public DirectoryJpaAdapter(SpringDataJpaDirectoryRepository repository, FileElementMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public Optional<Directory> findById(String id) {
        return repository.findById(id).map(mapper::toDomainEntity);
    }

    @Override
    public Directory save(Directory element) {
        JpaDirectory entity = mapper.toJpaEntity(element);
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
    public Class<Directory> getHandledClass() {
        return Directory.class;
    }

    @Override
    public String getHandledTypeIdentifier() {
        return Directory.TYPE_IDENTIFIER;
    }

    private void linkChildrenToParent(JpaDirectory dir) {
        if (dir.getContents() != null) {
            for (JpaFileElement<?> child : dir.getContents()) {
                child.setParent(dir);
            }
        }
    }
}
