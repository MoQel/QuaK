package edu.kit.quak.files;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.kit.quak.files.model.Directory;
import edu.kit.quak.files.model.File;
import edu.kit.quak.files.model.FileElement;
import edu.kit.quak.files.model.FileElementContainer;
import edu.kit.quak.files.model.Type;
import edu.kit.quak.files.repository.DirectoryRepository;
import edu.kit.quak.files.repository.FileRepository;
import edu.kit.quak.files.repository.RepoMonad;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.data.repository.CrudRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Optional;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@RestController
@RequestMapping("/file")
public class FileController {

    private final FileRepository files;
    private final DirectoryRepository directories;
    private final ObjectMapper objectMapper;

    public FileController(FileRepository files, DirectoryRepository directories, ObjectMapper objectMapper) {
        this.files = files;
        this.directories = directories;
        this.objectMapper = objectMapper;
        directories.save(new Directory());
    }


    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/")
    public FileElement<?> newFile(@RequestBody Map<String, Object> obj, @RequestHeader(name = "parent_id") String parent) {
        Type element = Type.getTypeByName(obj.getOrDefault("type", "").toString()).orElseThrow(
                () -> new ResponseStatusException(BAD_REQUEST, "Type of object could not be determined")
        );
        switch (element) {
            case FILE -> {
                return saveFile(objectMapper.convertValue(obj, File.class), parent);
            }
            case DIRECTORY -> {
                return saveDir(objectMapper.convertValue(obj, Directory.class), parent);
            }
            default -> throw new ResponseStatusException(BAD_REQUEST, "Given object type can not be saved under this endpoint");
        }
    }

    private File saveFile(File file, String parent) {
        RepoMonad<?> container = getFileElementContainer(parent);
        // Ensure that new file is created
        file.setId(null);
        final File saved  = files.save(file);
        container.addAndSave(parent, saved);
        return saved;
    }

    private RepoMonad<?> getFileElementContainer(String parent) {
        Optional<Type> type = Type.getTypeForId(parent);
        if (type.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "Given parent_id does not map to an existing element");
        }
        CrudRepository<? extends FileElementContainer, String> repo;
        switch (type.get()) {
            case DIRECTORY -> {
                return new RepoMonad<>(directories);
            }
            case PROJECT -> {
                return new RepoMonad<>(/* TODO */ directories);
            }
            default -> throw new ResponseStatusException(BAD_REQUEST, "Given id maps to a wrong type");
        }
    }

    private Directory saveDir(Directory dir, String parent) {
        RepoMonad<?> container = getFileElementContainer(parent);
        dir.setId(null);
        dir.getContent().forEach(dir::removeElement);
        final Directory saved = directories.save(dir);
        container.addAndSave(parent, saved);
        return saved;
    }

    @GetMapping("/{fId}")
    public FileElement<?> retrieveFile(@PathVariable String fId) {
        Optional<File> file = files.findById(fId);
        if (file.isPresent())
            return file.get();
        Optional<Directory> dir = directories.findById(fId);
        if (dir.isPresent())
            return dir.get();
        throw new ResponseStatusException(BAD_REQUEST, "No matching FileElement found for id");
    }

    @DeleteMapping("/{fId}")
    public void deleteFile(@PathVariable String fId) {
        files.findById(fId).ifPresent(files::delete);

        //Currently deleting a directory and all of its content
        Optional<Directory> dir = directories.findById(fId);
        dir.map(Directory::getContent)
                .ifPresent(s -> s.forEach(e -> this.deleteFile(e.getId())));
        dir.ifPresent(directories::delete);
    }

    @PatchMapping("/{fId}")
    public void patchFileElement(@PathVariable String fId, @RequestBody Map<String, Object> body) {
        Type element = Type.getTypeByName(body.getOrDefault("type", "").toString()).orElseThrow(
                () -> new ResponseStatusException(BAD_REQUEST, "Type of object could not be determined")
        );
        switch (element) {
            case FILE -> {
                File modified = objectMapper.convertValue(body, File.class);
                if (!fId.equals(modified.getId()))
                    throw new ResponseStatusException(BAD_REQUEST, "File-ID cannot be changed");
                File original = files.findById(modified.getId())
                        .orElseThrow(
                                () -> new ResponseStatusException(BAD_REQUEST, "Given file-ID does not resolve to an existing file.")
                        );
                original.patch(modified);
                files.save(original);
            }
            case DIRECTORY -> {
                Directory modified = objectMapper.convertValue(body, Directory.class);
                if (!fId.equals(modified.getId()))
                    throw new ResponseStatusException(BAD_REQUEST, "Directory-ID cannot be changed");
                Directory original = directories.findById(modified.getId())
                        .orElseThrow(
                                () -> new ResponseStatusException(BAD_REQUEST, "Given file-ID does not resolve to an existing file.")
                        );
                original.patch(modified);
                directories.save(original);
            }
            default -> throw new ResponseStatusException(BAD_REQUEST, "Given object type can not be modified under this endpoint");
        }
    }

    @GetMapping("/{fId}/content")
    public byte[] getFileContent(@PathVariable String fId, HttpServletResponse response) {
        File file = files.findById(fId).orElseThrow(
                () -> new ResponseStatusException(BAD_REQUEST, "Given file-ID does not resolve to an existing file.")
        );

        response.setContentType(file.getContentType());
        return file.getContent();
    }

    @PutMapping("/{fId}/content")
    public void setFileContent(@PathVariable String fId, @RequestBody byte[] content, @RequestHeader("Content-Type") String contentType) {
        File file = files.findById(fId).orElseThrow(
                () -> new ResponseStatusException(BAD_REQUEST, "Given file-ID does not resolve to an existing file.")
        );

        file.setContent(content);
        file.setContentType(contentType);
        file.setLastAccessNow();
        files.save(file);
    }
}
