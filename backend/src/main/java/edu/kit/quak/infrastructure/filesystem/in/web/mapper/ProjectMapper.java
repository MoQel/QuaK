package edu.kit.quak.infrastructure.filesystem.in.web.mapper;

import edu.kit.quak.core.filesystem.model.Project;
import edu.kit.quak.infrastructure.filesystem.in.web.dto.ProjectRequest;
import edu.kit.quak.infrastructure.filesystem.in.web.dto.ProjectContentsResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.dto.ProjectDetailsResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

import java.util.List;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface ProjectMapper {
    @Mapping(target = "parent", ignore = true)
    Project toDomain(ProjectRequest domain);

    @Mapping(target = "type", source = "domain.typeIdentifier")
    ProjectDetailsResponse toDetailsResponse(Project domain);

    @Mapping(target = "type", source = "domain.typeIdentifier")
    @Mapping(target = "contents", source = "domain.elements")
    ProjectContentsResponse toContentsResponse(Project domain);

    List<ProjectDetailsResponse> toDetailsResponseList(List<Project> domains);
}
