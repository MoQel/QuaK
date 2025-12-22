package edu.kit.quak.infrastructure.filesystem.in.web.rest.mapper;

import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.CreateFileRequest;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.FileContentResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.FileDetailsResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, uses = { FileElementDtoMapper.class })
public interface FileDtoMapper {

    @Mapping(target = "id", ignore = true) // ID created in domain
    @Mapping(target = "parentId", ignore = true) // ParentId set in application
    @Mapping(target = "createdOn", ignore = true)
    @Mapping(target = "lastAccess", ignore = true)
    File toDomain(CreateFileRequest request);

    @Mapping(target = "type", source = "typeIdentifier")
    FileDetailsResponse toDetailsResponse(File file);

    FileContentResponse toContentResponse(byte[] content);
}
