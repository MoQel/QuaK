package edu.kit.quak.infrastructure.filesystem.in.web.mapper;

import edu.kit.quak.infrastructure.filesystem.in.web.dto.DirectoryDetailsResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.dto.FileDetailsResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.dto.FileElementDto;
import edu.kit.quak.infrastructure.filesystem.in.web.dto.ProjectDetailsResponse;
import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.filesystem.model.FileElement;
import edu.kit.quak.core.filesystem.model.Project;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;
import org.mapstruct.SubclassMapping;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface FileElementMapper {

    // Check runtime type of element from Set<FileElement<?>> returned as contents in directory and project
    @SubclassMapping(source = File.class, target = FileDetailsResponse.class)
    @SubclassMapping(source = Directory.class, target = DirectoryDetailsResponse.class)
    @SubclassMapping(source = Project.class, target = ProjectDetailsResponse.class)
    FileElementDto toDto(FileElement<?> element);
}
