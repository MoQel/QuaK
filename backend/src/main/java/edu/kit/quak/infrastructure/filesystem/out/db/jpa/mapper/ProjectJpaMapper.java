package edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper;

import edu.kit.quak.core.filesystem.model.FileElement;
import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.infrastructure.filesystem.out.db.jpa.entity.JpaProject;
import org.mapstruct.*;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, uses = {FileElementJpaMapper.class})
public abstract class ProjectJpaMapper {

    @Mapping(target = "id", source = "id", qualifiedByName = "removePrefix")
    @Mapping(target = "parent", ignore = true)
    @Mapping(target = "contents", source = "contents")
    public abstract JpaProject toJpaEntity(Project domain);

    @Mapping(target = "id", source = "id", qualifiedByName = "addProjectPrefix")
    @Mapping(target = "parent", ignore = true)
    public abstract Project toDomainEntity(JpaProject jpaEntity);

    @Named("shallow")
    @Mapping(target = "id", source = "id", qualifiedByName = "addProjectPrefix")
    @Mapping(target = "parent", ignore = true)
    @Mapping(target = "contents", ignore = true)
    public abstract Project toDomainEntityShallow(JpaProject jpaEntity);

    @AfterMapping
    protected void linkChildren(@MappingTarget Project project) {
        for (FileElement<?> child : project.getContents()) {
            child.addToParent(project);
        }
    }
}
