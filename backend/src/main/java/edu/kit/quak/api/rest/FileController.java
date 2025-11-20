package edu.kit.quak.api.rest;

import edu.kit.quak.core.filesystem.domain.File;
import edu.kit.quak.core.filesystem.ports.incoming.FileServicePort;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/file")
public class FileController {

    private final FileServicePort service;

    public FileController(FileServicePort service) {
        this.service = service;
    }

    @PostMapping("/")
    @ResponseStatus(HttpStatus.CREATED)
    public File newFile(@RequestBody File file, @RequestHeader(name = "parent-id") String parentId) {
        return service.create(file, parentId);
    }

    @GetMapping("/{fId}")
    public File getFile(@PathVariable String fId) {
        return service.get(fId);
    }

    @DeleteMapping("/{fId}")
    public void deleteFile(@PathVariable String fId) {
        service.delete(fId);
    }

    @PatchMapping("/{fId}")
    public File patchFile(@PathVariable String fId, @RequestBody File modified) {
        File original = service.get(fId);
        try {
            original.patch(modified);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
        return service.update(original);
    }

    @GetMapping("/{fId}/content")
    public byte[] getFileContent(@PathVariable String fId, HttpServletResponse response) {
        File file = service.get(fId);
        response.setContentType(file.getContentType());
        return file.getContent();
    }

    @PutMapping("/{fId}/content")
    public void setFileContent(@PathVariable String fId,
                               @RequestBody byte[] content,
                               @RequestHeader("Content-Type") String contentType) {
        service.setContent(fId, content, contentType);
    }
}
