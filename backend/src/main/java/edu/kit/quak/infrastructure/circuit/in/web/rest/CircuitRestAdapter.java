package edu.kit.quak.infrastructure.circuit.in.web.rest;

import edu.kit.quak.application.circuit.ports.in.CircuitServicePort;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGateDefinitionIdentifier;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.AddGateRequest;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.ChangeQubitNameRequest;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.CircuitResponse;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.MoveGateRequest;
import edu.kit.quak.infrastructure.circuit.in.web.rest.mapper.CircuitDtoMapper;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/circuit")
@Tag(name = "Gates", description = "Quantum gate operations")
public class CircuitRestAdapter {
    private final CircuitServicePort service;
    private final CircuitDtoMapper mapper;

    public CircuitRestAdapter(CircuitServicePort service, CircuitDtoMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CircuitResponse init() {
        QuantumCircuit circuit = service.init();
        return mapper.toResponse(circuit);
    }

    @GetMapping("/{circuitId}")
    public CircuitResponse get(@PathVariable String circuitId) {
        QuantumCircuit circuit = service.get(circuitId);
        return mapper.toResponse(circuit);
    }

    @DeleteMapping("/{circuitId}")
    public void delete(@PathVariable String circuitId) {
        service.delete(circuitId);
    }

    @PostMapping("/{circuitId}/qubit")
    @ResponseStatus(HttpStatus.CREATED)
    public CircuitResponse addQubit(@PathVariable String circuitId) {
        QuantumCircuit circuit = service.addQubit(circuitId);
        return mapper.toResponse(circuit);
    }

    @PatchMapping("/{circuitId}/qubit")
    @ResponseStatus(HttpStatus.CREATED)
    public CircuitResponse changeQubitName(
            @PathVariable String circuitId, @RequestBody ChangeQubitNameRequest request) {
        QuantumCircuit circuit = service.changeQubitName(circuitId, request.id(), request.name());
        return mapper.toResponse(circuit);
    }

    @DeleteMapping("/{circuitId}/qubit/{qubitId}")
    public CircuitResponse deleteQubit(
            @PathVariable String circuitId, @PathVariable String qubitId) {
        QuantumCircuit circuit = service.deleteQubit(circuitId, qubitId);
        return mapper.toResponse(circuit);
    }

    @PostMapping("/{circuitId}/gate")
    @ResponseStatus(HttpStatus.CREATED)
    public CircuitResponse addGate(
            @PathVariable String circuitId, @RequestBody AddGateRequest request) {
        ElementaryQuantumGateDefinitionIdentifier definitionId =
                ElementaryQuantumGateDefinitionIdentifier.fromString(request.definitionId());
        QuantumCircuit circuit =
                service.addGate(
                        circuitId, definitionId, request.toQubitIdx(), request.toPositionIdx());
        return mapper.toResponse(circuit);
    }

    @PatchMapping("/{circuitId}/gate")
    public CircuitResponse moveGate(
            @PathVariable String circuitId, @RequestBody MoveGateRequest request) {
        QuantumCircuit circuit =
                service.moveGate(
                        circuitId, request.id(), request.toQubitIdx(), request.toPositionIdx());
        return mapper.toResponse(circuit);
    }

    @DeleteMapping("/{circuitId}/gate/{gateId}")
    public CircuitResponse deleteGate(@PathVariable String circuitId, @PathVariable String gateId) {
        QuantumCircuit circuit = service.deleteGate(circuitId, gateId);
        return mapper.toResponse(circuit);
    }
}
