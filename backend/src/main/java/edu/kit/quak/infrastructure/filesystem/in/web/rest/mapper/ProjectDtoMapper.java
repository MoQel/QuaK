package edu.kit.quak.infrastructure.filesystem.in.web.rest.mapper;

import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.ProjectContentsResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.ProjectDetailsResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.ProjectRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

import java.util.List;

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
    ProjectDetailsResponse toDetailsResponse(Project project);

    @Mapping(target = "type", source = "typeIdentifier")
    @Mapping(target = "contents", source = "contents")
    ProjectContentsResponse toContentsResponse(Project project);

    List<ProjectDetailsResponse> toDetailsResponseList(List<Project> projects);
}
