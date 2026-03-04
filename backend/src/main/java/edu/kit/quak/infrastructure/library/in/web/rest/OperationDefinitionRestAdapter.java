package edu.kit.quak.infrastructure.library.in.web.rest;

import edu.kit.quak.application.library.exceptions.OperationDefinitionNotFoundException;
import edu.kit.quak.application.library.ports.in.OperationDefinitionServicePort;
import edu.kit.quak.core.library.model.OperationDefinition;
import edu.kit.quak.infrastructure.library.in.web.rest.dto.OperationDefinitionResponse;
import edu.kit.quak.infrastructure.library.in.web.rest.mapper.OperationDefinitionDtoMapper;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/operations")
public class OperationDefinitionRestAdapter {

    private final OperationDefinitionServicePort operationDefinitionService;
    private final OperationDefinitionDtoMapper mapper;

    public OperationDefinitionRestAdapter(OperationDefinitionServicePort operationDefinitionService, OperationDefinitionDtoMapper mapper) {
        this.operationDefinitionService = operationDefinitionService;
        this.mapper = mapper;
    }

    @GetMapping
    public List<OperationDefinitionResponse> getAllOperationDefinitions() {
        List<OperationDefinition> domainOperationDefinitions = operationDefinitionService.getAllOperationDefinitions();
        return mapper.toResponseList(domainOperationDefinitions);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OperationDefinitionResponse> getOperationDefinitionById(@PathVariable String id) {
        return operationDefinitionService
            .getOperationDefinitionById(id)
            .map(mapper::toResponse) // Mapping Domain -> DTO
            .map(ResponseEntity::ok)
            .orElseThrow(() -> new OperationDefinitionNotFoundException(id));
    }
}
