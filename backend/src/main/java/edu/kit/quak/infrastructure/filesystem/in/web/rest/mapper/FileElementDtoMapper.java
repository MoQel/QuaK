package edu.kit.quak.infrastructure.filesystem.in.web.rest.mapper;

import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.filesystem.model.FileElement;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.FileElementDto;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

/**
 * Mapper for polymorphic FileElement types (File and Directory).
 *
 * <p>Note: This is a @Component instead of a MapStruct @Mapper because it performs runtime
 * polymorphic mapping. It inspects the actual type of FileElement at runtime and delegates to the
 * appropriate specialized mapper (FileDtoMapper or DirectoryDtoMapper). This dynamic dispatch logic
 * cannot be expressed in MapStruct's declarative mapping syntax, which is why we use a manual
 * component-based approach here.
 */
@Component
public class FileElementDtoMapper {

    @Autowired @Lazy protected FileDtoMapper fileMapper;

    @Autowired @Lazy protected DirectoryDtoMapper directoryMapper;

    public FileElementDto toDto(FileElement<?> element) {
        if (element instanceof File file) {
            return fileMapper.toDetailsResponse(file);
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
        return set.stream().map(this::toDto).collect(Collectors.toList());
    }
}
