package edu.kit.quak.infrastructure.filesystem.in.web.rest.mapper;

import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.DirectoryContentsResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.DirectoryDetailsResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.DirectoryRequest;
import edu.kit.quak.core.filesystem.model.Directory;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, uses = {FileElementDtoMapper.class})
public interface DirectoryDtoMapper {

    @Mapping(target = "parent", ignore = true)
    Directory toDomain(DirectoryRequest domain);

    @Mapping(target = "type", source = "domain.typeIdentifier")
    DirectoryDetailsResponse toDetailsResponse(Directory domain);

    @Mapping(target = "type", source = "domain.typeIdentifier")
    @Mapping(target = "contents", source = "domain.elements")
    DirectoryContentsResponse toContentsResponse(Directory domain);
}
