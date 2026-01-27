package edu.kit.quak.infrastructure.filesystem.in.web.rest;

import edu.kit.quak.application.filesystem.ports.in.FileServicePort;
import edu.kit.quak.application.user.ports.in.UserServicePort;
import edu.kit.quak.core.filesystem.model.File;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.*;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.mapper.FileDtoMapper;
import edu.kit.quak.infrastructure.user.in.web.rest.mapper.AuthenticationMapper;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/file")
@Tag(name = "Files", description = "File and directory management operations")
public class FileRestAdapter {

    private final FileServicePort service;
    private final UserServicePort userService;
    private final FileDtoMapper mapper;
    private final AuthenticationMapper authMapper;

    public FileRestAdapter(
            FileServicePort service,
            UserServicePort userService,
            FileDtoMapper mapper,
            AuthenticationMapper authMapper) {
        this.service = service;
        this.userService = userService;
        this.mapper = mapper;
        this.authMapper = authMapper;
    }

    @PostMapping("/")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public FileDetailsResponse createFile(
            @RequestBody @Valid CreateFileRequest request, // Triggers the Spring Validation
            @RequestHeader(name = ApiConstants.HEADER_PARENT_ID) String parentId,
            Authentication authentication) {
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        File fileToCreate = mapper.toDomain(request);
        File createdFile = service.createFile(fileToCreate, parentId, user);
        return mapper.toDetailsResponse(createdFile);
    }

    @GetMapping("/{fId}")
    @PreAuthorize("isAuthenticated()")
    public FileDetailsResponse retrieveFile(@PathVariable String fId, Authentication authentication) {
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        File domainFile = service.retrieveFile(fId, user);
        return mapper.toDetailsResponse(domainFile);
    }

    @DeleteMapping("/{fId}")
    @PreAuthorize("isAuthenticated()")
    public void deleteFile(@PathVariable String fId, Authentication authentication) {
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        service.removeFile(fId, user);
    }

    @PatchMapping("/{fId}")
    @PreAuthorize("isAuthenticated()")
    public FileDetailsResponse renameFile(
            @PathVariable String fId, @RequestBody RenameFileRequest request, Authentication authentication) {
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        File updatedFile = service.renameFile(fId, request.name(), user);
        return mapper.toDetailsResponse(updatedFile);
    }

    @GetMapping("/{fId}/content")
    @PreAuthorize("isAuthenticated()")
    public FileContentResponse getFileContent(@PathVariable String fId, Authentication authentication) {
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        byte[] content = service.getFileContent(fId, user);
        return mapper.toContentResponse(content);
    }

    @PutMapping("/{fId}/content")
    @PreAuthorize("isAuthenticated()")
    public void setFileContent(
            @PathVariable String fId, @RequestBody FileContentRequest fileContent, Authentication authentication) {
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        service.setFileContent(fId, fileContent.content(), fileContent.contentType(), user);
    }
}
