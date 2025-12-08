package edu.kit.quak.infrastructure.filesystem.in.web.rest.mapper;

import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.filesystem.model.FileElement;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.FileElementDto;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING, uses = {FileDtoMapper.class, DirectoryDtoMapper.class})
public abstract class FileElementDtoMapper {

    @Autowired
    protected FileDtoMapper fileMapper;

    @Autowired
    protected DirectoryDtoMapper directoryMapper;

    public FileElementDto toDto(FileElement<?> element) {
        if (element instanceof File file) {
            return fileMapper.toDetailsResponse(file); // oder @Autowired Mapper, wenn Spring
        } else if (element instanceof Directory dir) {
            return directoryMapper.toDetailsResponse(dir);
        } else {
            throw new IllegalArgumentException("Unknown FileElement type: " + element.getClass());
        }
    }


    public List<FileElementDto> mapSetToList(Set<FileElement<?>> set) {
        if (set == null) {
            return null;
        }
        return set.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }
}
