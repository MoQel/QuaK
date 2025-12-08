package edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper;

import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaProject;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, uses = {FileElementJpaMapper.class})
public interface ProjectJpaMapper {
    @Mapping(target = "parent", ignore = true)
    @Mapping(target = "contents", source = "contents")
    JpaProject toJpaEntity(Project domain);

    @Mapping(target = "parent", ignore = true)
    Project toDomainEntity(JpaProject jpaEntity);
}
