package edu.kit.quak.infrastructure.filesystem.persistence.jpa.adapter;

import edu.kit.quak.core.filesystem.domain.FileElement;
import edu.kit.quak.core.filesystem.domain.FileElementContainer;
import edu.kit.quak.core.filesystem.ports.outgoing.FileElementContainerRepositoryPort;
import edu.kit.quak.infrastructure.filesystem.persistence.jpa.entity.JpaFileElement;
import edu.kit.quak.infrastructure.filesystem.persistence.jpa.mapper.FileElementMapper;
import edu.kit.quak.infrastructure.filesystem.persistence.jpa.repository.SpringDataJpaFileElementRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class FileElementContainerJpaAdapter extends FileElementJpaAdapter implements FileElementContainerRepositoryPort {

    public FileElementContainerJpaAdapter(SpringDataJpaFileElementRepository jpaRepository, FileElementMapper mapper) {
        super(jpaRepository, mapper);
    }

    // TODO implement findById & save
    public Optional<FileElementContainer<?>> findById(String id) {
        return null;
    }

    @Override
    public FileElementContainer<?> save(FileElementContainer<?> element) {
        return null;
    }

    @Override
    public List<FileElement<?>> findImmediateChildren(String parentId) {
        List<JpaFileElement<?>> jpaChildren = jpaRepository.findByParentId(parentId);
        return jpaChildren.stream()
                .map(mapper::toDomainEntity)
                .collect(Collectors.toList());
    }
}
