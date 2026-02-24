package edu.kit.quak.infrastructure.library.in.web.rest;

import edu.kit.quak.application.library.exceptions.GateDefinitionNotFoundException;
import edu.kit.quak.application.library.ports.in.GateDefinitionServicePort;
import edu.kit.quak.core.library.model.GateDefinition;
import edu.kit.quak.infrastructure.library.in.web.rest.dto.GateDefinitionResponse;
import edu.kit.quak.infrastructure.library.in.web.rest.mapper.GateDefinitionDtoMapper;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/gates")
public class GateDefinitionRestAdapter {

    private final GateDefinitionServicePort gateService;
    private final GateDefinitionDtoMapper mapper;

    public GateDefinitionRestAdapter(GateDefinitionServicePort gateService, GateDefinitionDtoMapper mapper) {
        this.gateService = gateService;
        this.mapper = mapper;
    }

    @GetMapping
    public List<GateDefinitionResponse> getAllGates() {
        List<GateDefinition> domainGateDefinitions = gateService.getAllGateDefinitions();
        return mapper.toResponseList(domainGateDefinitions);
    }

    @GetMapping("/{id}")
    public ResponseEntity<GateDefinitionResponse> getGateById(@PathVariable String id) {
        return gateService
            .getGateDefinitionById(id)
            .map(mapper::toResponse) // Mapping Domain -> DTO
            .map(ResponseEntity::ok)
            .orElseThrow(() -> new GateDefinitionNotFoundException(id));
    }
}
