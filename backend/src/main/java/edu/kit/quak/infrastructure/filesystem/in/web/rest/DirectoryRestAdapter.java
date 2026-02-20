package edu.kit.quak.infrastructure.filesystem.in.web.rest;

import edu.kit.quak.application.filesystem.ports.in.DirectoryServicePort;
import edu.kit.quak.application.user.ports.in.UserServicePort;
import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.DirectoryContentsResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.DirectoryDetailsResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.DirectoryRequest;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.mapper.DirectoryDtoMapper;
import edu.kit.quak.infrastructure.user.in.web.rest.mapper.AuthenticationMapper;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/directory")
@Tag(name = "Files", description = "File and directory management operations")
public class DirectoryRestAdapter {

    private final DirectoryServicePort service;
    private final UserServicePort userService;
    private final DirectoryDtoMapper mapper;
    private final AuthenticationMapper authMapper;

    public DirectoryRestAdapter(
        DirectoryServicePort service,
        UserServicePort userService,
        DirectoryDtoMapper mapper,
        AuthenticationMapper authMapper
    ) {
        this.service = service;
        this.userService = userService;
        this.mapper = mapper;
        this.authMapper = authMapper;
    }

    @PostMapping("/")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public DirectoryDetailsResponse createDirectory(
        @RequestBody DirectoryRequest request,
        @RequestHeader(name = ApiConstants.HEADER_PARENT_ID) String parentId,
        Authentication authentication
    ) {
        log.info("REST request to create directory '{}' in parent '{}'", request.name(), parentId);
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        Directory directoryToCreate = mapper.toDomain(request);
        Directory createdDirectory = service.createDirectory(directoryToCreate, parentId, user);
        return mapper.toDetailsResponse(createdDirectory);
    }

    @GetMapping("/{dId}")
    @PreAuthorize("isAuthenticated()")
    public DirectoryContentsResponse retrieveDirectory(@PathVariable String dId, Authentication authentication) {
        log.debug("REST request to retrieve directory '{}'", dId);
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        Directory dir = service.retrieveDirectory(dId, user);
        return mapper.toContentsResponse(dir);
    }

    @DeleteMapping("/{dId}")
    @PreAuthorize("isAuthenticated()")
    public void deleteDirectory(@PathVariable String dId, Authentication authentication) {
        log.debug("REST request to delete directory '{}'", dId);
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        service.removeDirectory(dId, user);
    }

    @PatchMapping("/{dId}")
    @PreAuthorize("isAuthenticated()")
    public DirectoryDetailsResponse renameDirectory(
        @PathVariable String dId,
        @RequestBody DirectoryRequest request,
        Authentication authentication
    ) {
        log.debug("REST request to rename directory '{}'", dId);
        User user = userService.getAuthenticatedUser(authMapper.toDomain(authentication));
        Directory updatedDirectory = service.renameDirectory(dId, request.name(), user);
        return mapper.toDetailsResponse(updatedDirectory);
    }
}
