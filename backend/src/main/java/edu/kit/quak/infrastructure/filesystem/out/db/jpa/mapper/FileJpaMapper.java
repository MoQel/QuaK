package edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper;

import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaDirectory;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaFile;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaProject;
import org.mapstruct.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING,
        uses = {DirectoryJpaMapper.class, ProjectJpaMapper.class, FileElementJpaMapper.class})
public abstract class FileJpaMapper {

    @Autowired
    @Lazy
    protected DirectoryJpaMapper directoryMapper;

    @Autowired
    @Lazy
    protected ProjectJpaMapper projectMapper;

    @Mapping(target = "id", source = "id", qualifiedByName = "removePrefix")
    @Mapping(target = "parent", ignore = true)
    public abstract JpaFile toJpaEntity(File domain);

    @Mapping(target = "id", source = "id", qualifiedByName = "addFilePrefix")
    @Mapping(target = "parent", ignore = true)
    public abstract File toDomainEntity(JpaFile jpaEntity);

    @AfterMapping
    protected void mapParent(@MappingTarget File domain, JpaFile jpa) {
        switch (jpa.getParent()) {
            case JpaDirectory dir -> domain.setParent(directoryMapper.toDomainEntityShallow(dir));
            case JpaProject proj -> domain.setParent(projectMapper.toDomainEntityShallow(proj));
            case null, default -> {
            }
        }

    }
}
