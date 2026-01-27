package edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper;

import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaFile;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(
        componentModel = MappingConstants.ComponentModel.SPRING,
        uses = {FileElementJpaMapper.class})
public abstract class FileJpaMapper {

    @Mapping(target = "id", source = "id")
    @Mapping(target = "parent", ignore = true) // Is set automatically - we never store Files directly
    public abstract JpaFile toJpaEntity(File domain);

    @Mapping(target = "id", source = "id")
    @Mapping(target = "parentId", source = "parent.id")
    public abstract File toDomainEntity(JpaFile jpaEntity);
}
