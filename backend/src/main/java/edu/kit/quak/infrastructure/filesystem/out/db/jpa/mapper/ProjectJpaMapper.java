package edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper;

import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaProject;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, uses = {FileElementJpaMapper.class})
public abstract class ProjectJpaMapper {

    @Mapping(target = "id", source = "id")
    @Mapping(target = "parent", ignore = true) // We don't have a parent
    @Mapping(target = "contents", source = "contents")
    public abstract JpaProject toJpaEntity(Project domain);

    @Mapping(target = "id", source = "id")
    @Mapping(target = "parentId", source = "parent.id")
    public abstract Project toDomainEntity(JpaProject jpaEntity);
}
