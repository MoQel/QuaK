package edu.kit.quak.infrastructure.filesystem.in.web.rest.mapper;

import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.DirectoryDetailsResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.FileDetailsResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.FileElementDto;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.ProjectDetailsResponse;
import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.filesystem.model.FileElement;
import edu.kit.quak.core.filesystem.model.Project;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;
import org.mapstruct.SubclassMapping;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface FileElementDtoMapper {

    // Check runtime type of element from Set<FileElement<?>> returned as contents in directory and project
    @SubclassMapping(source = File.class, target = FileDetailsResponse.class)
    @SubclassMapping(source = Directory.class, target = DirectoryDetailsResponse.class)
    @SubclassMapping(source = Project.class, target = ProjectDetailsResponse.class)
    FileElementDto toDto(FileElement<?> element);
}
