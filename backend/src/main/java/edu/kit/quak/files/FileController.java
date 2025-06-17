package edu.kit.quak.files;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.kit.quak.files.model.Directory;
import edu.kit.quak.files.model.File;
import edu.kit.quak.files.model.FileElement;
import edu.kit.quak.files.repository.DirectoryRepository;
import edu.kit.quak.files.repository.FileRepository;
import edu.kit.quak.files.repository.RepoMonad;
import edu.kit.quak.files.repository.savers.FileElementSaver;
import edu.kit.quak.files.repository.savers.FileElementSaversRepository;
import jakarta.servlet.http.HttpServletResponse;
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

/**
 * This controller handles all the calls to the {@code /file/} endpoint.
 * See the API-documentation for further information.
 *
 * @author Henrik K
 */
@RestController
@RequestMapping("/file")
public class FileController {

    private final FileRepository files;
    private final DirectoryRepository directories;
    private final ObjectMapper objectMapper;
    private final FileElementSaversRepository savers;

    public FileController(FileRepository files, DirectoryRepository directories, ObjectMapper objectMapper, FileElementSaversRepository savers) {
        this.files = files;
        this.directories = directories;
        this.objectMapper = objectMapper;
        this.savers = savers;
    }


    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/")
    public FileElement<?> newFile(@RequestBody Map<String, Object> obj, @RequestHeader(name = "parent_id") String parent) {
        final RepoMonad<?> dest = savers.getSaverForElementId(parent)
                                        .flatMap(FileElementSaver::getRepoMonad)
                                        .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "No matching parent found"));
        final FileElement<?> saved = savers.getSaverForTypeName(obj.getOrDefault("type", "").toString())
                .map(s -> s.mapAndSaveNew(objectMapper, obj))
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Given object type can not be saved under this endpoint"));
        dest.addAndSave(parent, saved);
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
        Optional<File> file = files.findById(fId);
        Optional<Directory> directory = directories.findById(fId);
        if (file.isPresent()) {
            File base = file.get();
            body.put("type", base.getTypeIdentifier());
            patchFile(base, body);
        } else if (directory.isPresent()) {
            Directory base = directory.get();
            body.put("type", base.getTypeIdentifier());
            patchDirectory(base, body);
        } else {
            throw new ResponseStatusException(BAD_REQUEST, "Given ID did not resolve to file or directory");
        }
    }

    private void patchFile(File original, Map<String, Object> body) {
        File patch = objectMapper.convertValue(body, File.class);
        try {
            original.patch(patch);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(BAD_REQUEST, e.getMessage());
        }
        files.save(original);
    }

    private void patchDirectory(Directory original, Map<String, Object> body) {
        Directory patch = objectMapper.convertValue(body, Directory.class);
        try {
            original.patch(patch);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(BAD_REQUEST, e.getMessage());
        }
        directories.save(original);
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
