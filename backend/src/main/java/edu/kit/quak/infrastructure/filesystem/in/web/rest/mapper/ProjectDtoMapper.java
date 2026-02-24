package edu.kit.quak.infrastructure.filesystem.in.web.rest.mapper;

import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.ProjectContentsResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.ProjectDetailsResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.ProjectRequest;
import edu.kit.quak.infrastructure.user.in.web.rest.dto.UserResponse;
import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, uses = { FileElementDtoMapper.class })
public interface ProjectDtoMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "parentId", ignore = true)
    @Mapping(target = "contents", ignore = true)
    @Mapping(target = "createdOn", ignore = true)
    @Mapping(target = "lastAccess", ignore = true)
    @Mapping(target = "ownerId", ignore = true) // Set by service layer from auth context
    Project toDomain(ProjectRequest request);

    @Mapping(target = "type", source = "typeIdentifier")
    @Mapping(target = "owner", ignore = true)
    ProjectDetailsResponse toDetailsResponse(Project project);

    @Mapping(target = "type", source = "project.typeIdentifier")
    @Mapping(target = "id", source = "project.id")
    @Mapping(target = "name", source = "project.name")
    @Mapping(target = "createdOn", source = "project.createdOn")
    @Mapping(target = "lastAccess", source = "project.lastAccess")
    @Mapping(target = "owner", source = "owner")
    ProjectDetailsResponse toDetailsResponse(Project project, UserResponse owner);

    @Mapping(target = "type", source = "typeIdentifier")
    @Mapping(target = "contents", source = "contents")
    ProjectContentsResponse toContentsResponse(Project project);

    List<ProjectDetailsResponse> toDetailsResponseList(List<Project> projects);
}
