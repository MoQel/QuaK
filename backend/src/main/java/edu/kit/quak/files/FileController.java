package edu.kit.quak.files;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.kit.quak.files.model.Directory;
import edu.kit.quak.files.model.File;
import edu.kit.quak.files.model.FileElement;
import edu.kit.quak.files.repository.FileRepository;
import edu.kit.quak.files.repository.RepoMonad;
import edu.kit.quak.files.repository.savers.FileElementSaver;
import edu.kit.quak.files.repository.savers.FileElementSaversRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.transaction.Transactional;
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

import static edu.kit.quak.files.model.FileElement.TYPE_FIELD;
import static org.springframework.http.HttpStatus.BAD_REQUEST;

/**
 * This controller handles all the calls to the {@code /file/} endpoint.
 * See the API-documentation for further information.
 *
 * @author Henrik K
 */
@RestController
@RequestMapping("/file")
@Tag(name = "Files", description = "File and directory management operations")
public class FileController {

    private static final Class<?>[] FILTER = {File.class, Directory.class};

    private final FileRepository files;
    private final ObjectMapper objectMapper;
    private final FileElementSaversRepository savers;

    public FileController(FileRepository files, ObjectMapper objectMapper, FileElementSaversRepository savers) {
        this.files = files;
        this.objectMapper = objectMapper;
        this.savers = savers;
    }

    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/")
    public FileElement<?> newFile(@RequestBody Map<String, Object> obj, @RequestHeader(name = "parent-id") String parent) {
        final RepoMonad<?> dest = savers.getSaverForElementId(parent)
                                        .flatMap(FileElementSaver::getRepoMonad)
                                        .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "No matching parent found"));
        return savers.getSaverForTypeName(obj.getOrDefault(TYPE_FIELD, "").toString(), FILTER)
                     .map(s -> {
                    try {
                        return s.mapAndSaveNew(objectMapper, obj, element -> dest.addAndSave(parent, element));
                    } catch (IllegalArgumentException e) {
                        throw new ResponseStatusException(BAD_REQUEST, e.getMessage());
                    }
                })
                     .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Given object type can not be saved under this endpoint"));
    }

    @GetMapping("/{fId}")
    public FileElement<?> retrieveFile(@PathVariable String fId) {
        return savers.getSaverForElementId(fId, FILTER)
                .map(FileElementSaver::getRepository)
                .flatMap(repo -> repo.findById(fId))
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "No matching FileElement found for id"));
    }

    @DeleteMapping("/{fId}")
    @Transactional
    public void deleteFile(@PathVariable String fId) {
        try {
            savers.delete(fId, FILTER);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(BAD_REQUEST, e.getMessage());
        }
    }

    @PatchMapping("/{fId}")
    public void patchFileElement(@PathVariable String fId, @RequestBody Map<String, Object> body) {
        try {
            savers.getSaverForElementId(fId, FILTER)
                  .ifPresent(sav -> sav.patch(fId, (toPatch, clazz) -> {
                      body.put(TYPE_FIELD, toPatch.getTypeIdentifier());
                      return objectMapper.convertValue(body, clazz);
                  }));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(BAD_REQUEST, e.getMessage());
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
