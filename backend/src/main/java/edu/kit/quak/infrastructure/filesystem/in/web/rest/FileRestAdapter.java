package edu.kit.quak.infrastructure.filesystem.in.web.rest;

import edu.kit.quak.application.filesystem.ports.in.FileServicePort;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.*;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.mapper.FileDtoMapper;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/file")
public class FileRestAdapter {

    private final FileServicePort service;
    private final FileDtoMapper mapper;

    public FileRestAdapter(FileServicePort service, FileDtoMapper mapper) {
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
        File domainFile = service.retrieveFile(fId);
        return mapper.toDetailsResponse(domainFile);
    }

    @DeleteMapping("/{fId}")
    public void deleteFile(@PathVariable String fId) {
        service.removeFile(fId);
    }

    @PatchMapping("/{fId}")
    public FileDetailsResponse renameFile(
            @PathVariable String fId,
            @RequestBody RenameFileRequest request) {
        File updatedFile = service.renameFile(fId, request.name());
        return mapper.toDetailsResponse(updatedFile);
    }

    @GetMapping("/{fId}/content")
    public FileContentResponse getFileContent(@PathVariable String fId) {
        byte[] content = service.getFileContent(fId);
        return mapper.toContentResponse(content);
    }

    @PutMapping("/{fId}/content")
    public void setFileContent(@PathVariable String fId,
                               @RequestBody FileContentRequest fileContent) {
        service.setFileContent(fId, fileContent.content(), fileContent.contentType());
    }
}
