package edu.kit.quak.infrastructure.filesystem.in.web.rest;

import edu.kit.quak.application.filesystem.ports.in.DirectoryServicePort;
import edu.kit.quak.core.filesystem.model.Directory;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.DirectoryContentsResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.DirectoryDetailsResponse;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.dto.DirectoryRequest;
import edu.kit.quak.infrastructure.filesystem.in.web.rest.mapper.DirectoryDtoMapper;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

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
    public DirectoryDetailsResponse createDirectory(@RequestBody DirectoryRequest request, @RequestHeader(name = ApiConstants.HEADER_PARENT_ID) String parentId) {
        Directory directoryToCreate = mapper.toDomain(request);
        Directory createdDirectory = service.createDirectory(directoryToCreate, parentId);
        return mapper.toDetailsResponse(createdDirectory);
    }

    @GetMapping("/{dId}")
    public DirectoryContentsResponse retrieveDirectory(@PathVariable String dId) {
        Directory dir =  service.retrieveDirectory(dId);

        return mapper.toContentsResponse(dir);
    }

    @DeleteMapping("/{dId}")
    public void deleteDirectory(@PathVariable String dId) {
        service.removeDirectory(dId);
    }

    @PatchMapping("/{dId}")
    public DirectoryDetailsResponse renameDirectory(@PathVariable String dId, @RequestBody DirectoryRequest request) {
        Directory updatedDirectory = service.renameDirectory(dId, request.name());
        return mapper.toDetailsResponse(updatedDirectory);
    }
}
