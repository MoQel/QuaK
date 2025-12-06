package edu.kit.quak.infrastructure.filesystem.in.web.rest;

import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.DirectoryContentsResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.DirectoryDetailsResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.DirectoryRequest;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.mapper.DirectoryDtoMapper;
import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.application.filesystem.ports.in.DirectoryServicePort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/directory")
public class DirectoryRestAdapter {
    private final DirectoryServicePort service;
    private final DirectoryDtoMapper mapper;

    public DirectoryRestAdapter(DirectoryServicePort service, DirectoryDtoMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @PostMapping("/")
    @ResponseStatus(HttpStatus.CREATED)
    public DirectoryDetailsResponse createDirectory(@RequestBody DirectoryRequest request, @RequestHeader(name = "parent-id") String parentId) {
        Directory directoryToCreate = mapper.toDomain(request);
        Directory createdDirectory = service.createDirectory(directoryToCreate, parentId);
        return mapper.toDetailsResponse(createdDirectory);
    }

    @GetMapping("/{dId}")
    public DirectoryContentsResponse retrieveDirectory(@PathVariable String dId) {
        Directory dir =  service.retrieveDirectory(dId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Directory not found"));
        return mapper.toContentsResponse(dir);
    }

    @DeleteMapping("/{dId}")
    public void deleteDirectory(@PathVariable String dId) {
        try {
            service.removeDirectory(dId);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    @PatchMapping("/{dId}")
    public DirectoryDetailsResponse renameDirectory(@PathVariable String dId, @RequestBody DirectoryRequest request) {
        Directory updatedDirectory = service.renameDirectory(dId, request.name())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Directory not found"));
        return mapper.toDetailsResponse(updatedDirectory);
    }
}
