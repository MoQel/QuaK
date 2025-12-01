package edu.kit.quak.infrastructure.filesystem.out.persistence.jpa.adapter;

import edu.kit.quak.core.filesystem.model.FileElement;
import edu.kit.quak.core.filesystem.model.FileElementContainer;
import edu.kit.quak.application.filesystem.ports.outgoing.FileElementContainerRepositoryPort;
import edu.kit.quak.infrastructure.filesystem.out.persistence.jpa.entity.JpaFileElement;
import edu.kit.quak.infrastructure.filesystem.out.persistence.jpa.entity.JpaFileElementContainer;
import edu.kit.quak.infrastructure.filesystem.out.persistence.jpa.mapper.FileElementMapper;
import edu.kit.quak.infrastructure.filesystem.out.persistence.jpa.repository.SpringDataJpaFileElementRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class FileElementContainerJpaAdapter extends FileElementJpaAdapter implements FileElementContainerRepositoryPort {

    public FileElementContainerJpaAdapter(SpringDataJpaFileElementRepository jpaRepository, FileElementMapper mapper) {
        super(jpaRepository, mapper);
    }

    @Override
    public List<FileElement<?>> findImmediateChildren(String parentId) {
        List<JpaFileElement<?>> jpaChildren = jpaRepository.findByParentId(parentId);
        return jpaChildren.stream()
                .map(mapper::toDomainEntity)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<FileElementContainer<?>> findContainerById(String id) {
        return jpaRepository.findById(id)
                .filter(JpaFileElementContainer.class::isInstance)
                .map(JpaFileElementContainer.class::cast)
                .map(mapper::toDomainEntity);
    }
}
