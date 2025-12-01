package edu.kit.quak.infrastructure.filesystem.in.web.mapper;

import edu.kit.quak.infrastructure.filesystem.in.web.dto.CreateFileRequest;
import edu.kit.quak.infrastructure.filesystem.in.web.dto.FileContentDto;
import edu.kit.quak.infrastructure.filesystem.in.web.dto.FileDetailsResponse;
import edu.kit.quak.core.filesystem.model.File;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface FileMapper {

    @Mapping(target = "id", ignore = true) // ID created in persistence
    @Mapping(target = "parent", ignore = true) // Parent set in persistence
    @Mapping(target = "createdOn", ignore = true)
    @Mapping(target = "lastAccess",ignore = true)
    File toDomain(CreateFileRequest request);

    @Mapping(target = "type", source = "domain.typeIdentifier")
    FileDetailsResponse toDetailsResponse(File domain);

    FileContentDto toContentResponse(File domain);
}
