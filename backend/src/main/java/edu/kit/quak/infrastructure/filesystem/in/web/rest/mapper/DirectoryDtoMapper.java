package edu.kit.quak.infrastructure.filesystem.in.web.rest.mapper;

import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.DirectoryContentsResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.DirectoryDetailsResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.DirectoryRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(
        componentModel = MappingConstants.ComponentModel.SPRING,
        uses = {FileElementDtoMapper.class})
public interface DirectoryDtoMapper {

    @Mapping(target = "parentId", ignore = true)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "contents", ignore = true)
    @Mapping(target = "createdOn", ignore = true)
    @Mapping(target = "lastAccess", ignore = true)
    Directory toDomain(DirectoryRequest request);

    @Mapping(target = "type", source = "typeIdentifier")
    DirectoryDetailsResponse toDetailsResponse(Directory directory);

    @Mapping(target = "type", source = "typeIdentifier")
    @Mapping(target = "contents", source = "contents")
    DirectoryContentsResponse toContentsResponse(Directory directory);
}
