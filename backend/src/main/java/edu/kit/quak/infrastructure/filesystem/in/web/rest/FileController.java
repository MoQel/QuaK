package edu.kit.quak.infrastructure.filesystem.in.web.rest;

import edu.kit.quak.infrastructure.filesystem.in.web.dto.CreateFileRequest;
import edu.kit.quak.infrastructure.filesystem.in.web.dto.FileContentDto;
import edu.kit.quak.infrastructure.filesystem.in.web.dto.FileDetailsResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.dto.RenameFileRequest;
import edu.kit.quak.infrastructure.filesystem.in.web.mapper.FileMapper;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.application.filesystem.ports.incoming.FileServicePort;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

// TODO: Error Messages und werfen von errors überprüfen anpassen oder wie in OpenApi yaml
@RestController
@RequestMapping("/file")
public class FileController {

    private final FileServicePort service;
    private final FileMapper mapper;

    public FileController(FileServicePort service, FileMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @PostMapping("/")
    @ResponseStatus(HttpStatus.CREATED)
    public FileDetailsResponse createFile(
            @RequestBody @Valid CreateFileRequest request, // Triggers the Spring Validation
            @RequestHeader(name = "parent-id") String parentId
    ) {
        File fileToCreate = mapper.toDomain(request);
        File createdFile = service.createFile(fileToCreate, parentId);
        return mapper.toDetailsResponse(createdFile);
    }

    @GetMapping("/{fId}")
    public FileDetailsResponse retrieveFile(@PathVariable String fId) {
        File domainFile = service.retrieveFile(fId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));
        return mapper.toDetailsResponse(domainFile);
    }

    @DeleteMapping("/{fId}")
    public void deleteFile(@PathVariable String fId) {
        try {
            service.removeFile(fId);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    @PatchMapping("/{fId}")
    public FileDetailsResponse renameFile(
            @PathVariable String fId,
            @RequestBody RenameFileRequest request) {
        File updatedFile = service.renameFile(fId, request.name())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));
        return mapper.toDetailsResponse(updatedFile);
    }

    @GetMapping("/{fId}/content")
    public FileContentDto getFileContent(@PathVariable String fId) {
        File file = service.retrieveFile(fId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));
        return mapper.toContentResponse(file);
    }

    @PutMapping("/{fId}/content")
    public void setFileContent(@PathVariable String fId,
                               @RequestBody FileContentDto fileContent) {
        try {
            service.setFileContent(fId, fileContent.content(), fileContent.contentType());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }
}
