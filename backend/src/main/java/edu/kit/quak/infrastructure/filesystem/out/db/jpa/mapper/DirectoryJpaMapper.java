package edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper;

import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.filesystem.model.FileElement;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaDirectory;
import org.mapstruct.*;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, uses = {FileElementJpaMapper.class})
public abstract class DirectoryJpaMapper {
    @Mapping(target = "parent", ignore = true)
    @Mapping(target = "contents", source = "contents")
    public abstract JpaDirectory toJpaEntity(Directory domain);

    @Mapping(target = "parent", ignore = true)
    public abstract Directory toDomainEntity(JpaDirectory jpaEntity);

    @AfterMapping
    protected void linkChildren(@MappingTarget Directory dir) {
        for (FileElement<?> child : dir.getContents()) {
            child.setParent(dir);
        }
    }
}
