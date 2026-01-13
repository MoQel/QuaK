package edu.kit.quak.infrastructure.library.in.web.rest;

import edu.kit.quak.application.library.exceptions.GateNotFoundException;
import edu.kit.quak.application.library.ports.in.GateServicePort;
import edu.kit.quak.core.library.model.Gate;
import edu.kit.quak.infrastructure.library.in.web.rest.dto.LibraryGateResponse;
import edu.kit.quak.infrastructure.library.in.web.rest.mapper.LibraryGateDtoMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/gates")
public class GateRestAdapter {

    private final GateServicePort gateService;
    private final LibraryGateDtoMapper mapper;

    public GateRestAdapter(GateServicePort gateService, LibraryGateDtoMapper mapper) {
        this.gateService = gateService;
        this.mapper = mapper;
    }

    @GetMapping
    public List<LibraryGateResponse> getAllGates() {
        List<Gate> domainGates = gateService.getAllGates();
        return mapper.toResponseList(domainGates);
    }

    @GetMapping("/{name}")
    public ResponseEntity<LibraryGateResponse> getGateByName(@PathVariable String name) {
        return gateService.getGateByName(name)
                .map(mapper::toResponse) // Mapping Domain -> DTO
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new GateNotFoundException(name));
    }
}