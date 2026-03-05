package edu.kit.quak.infrastructure.library.in.web.rest;

import edu.kit.quak.application.library.ports.in.OperationDefinitionServicePort;
import edu.kit.quak.core.library.model.OperationDefinition;
import edu.kit.quak.infrastructure.library.in.web.rest.dto.OperationDefinitionResponse;
import edu.kit.quak.infrastructure.library.in.web.rest.mapper.OperationDefinitionDtoMapper;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/operations")
public class OperationDefinitionRestAdapter {

    private final OperationDefinitionServicePort gateService;
    private final OperationDefinitionDtoMapper mapper;

    public OperationDefinitionRestAdapter(OperationDefinitionServicePort gateService, OperationDefinitionDtoMapper mapper) {
        this.gateService = gateService;
        this.mapper = mapper;
    }

    @GetMapping
    public List<OperationDefinitionResponse> getAllGates() {
        log.debug("REST request get all GateDefinitions");
        List<OperationDefinition> domainOperationDefinitions = gateService.getAllOperationDefinitions();
        return mapper.toResponseList(domainOperationDefinitions);
    }

    @GetMapping("/{id}")
    public OperationDefinitionResponse getGateById(@PathVariable String id) {
        log.debug("REST request get GateDefinitions by Id {}", id);
        return mapper.toResponse(gateService.getOperationDefinitionById(id));
    }
}
