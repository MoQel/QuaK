package edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper;

import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaDirectory;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, uses = { FileElementJpaMapper.class })
public abstract class DirectoryJpaMapper {

    @Mapping(target = "id", source = "id")
    @Mapping(target = "parent", ignore = true) // Is set in Adapter
    @Mapping(target = "contents", source = "contents")
    @Mapping(target = "lastAccess", source = "lastAccess")
    public abstract JpaDirectory toJpaEntity(Directory domain);

    @Mapping(target = "id", source = "id")
    @Mapping(target = "parentId", source = "parent.id")
    public abstract Directory toDomainEntity(JpaDirectory jpaEntity);
}
