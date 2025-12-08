package edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper;

import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaFile;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, uses = {FileElementJpaMapper.class})
public interface FileJpaMapper {
    @Mapping(target = "parent", ignore = true)
    JpaFile toJpaEntity(File domain);

    @Mapping(target = "parent", ignore = true)
    File toDomainEntity(JpaFile jpaEntity);
}
