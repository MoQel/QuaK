package edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper;

import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaDirectory;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, uses = {FileElementJpaMapper.class})
public interface DirectoryJpaMapper {
    @Mapping(target = "parent", ignore = true)
    @Mapping(target = "contents", source = "contents")
    JpaDirectory toJpaEntity(Directory domain);

    @Mapping(target = "parent", ignore = true)
    Directory toDomainEntity(JpaDirectory jpaEntity);
}
