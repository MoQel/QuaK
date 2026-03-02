package edu.kit.quak.infrastructure.circuit.in.web.rest;

import edu.kit.quak.application.circuit.ports.in.CircuitServicePort;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.AddQuantumOperationRequest;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.CircuitResponse;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.MoveQuantumOperationRequest;
import edu.kit.quak.infrastructure.circuit.in.web.rest.mapper.CircuitDtoMapper;
import edu.kit.quak.infrastructure.circuit.in.web.rest.mapper.ElementSelectorDtoMapper;
import edu.kit.quak.infrastructure.circuit.in.web.rest.mapper.QuantumOperationDtoMapper;
import java.util.List;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/circuit")
public class CircuitRestAdapter {

    private final CircuitServicePort service;
    private final CircuitDtoMapper mapper;
    private final QuantumOperationDtoMapper quantumOperationDtoMapper;
    private final ElementSelectorDtoMapper elementSelectorDtoMapper;

    public CircuitRestAdapter(
        CircuitServicePort service,
        CircuitDtoMapper mapper,
        QuantumOperationDtoMapper quantumOperationDtoMapper,
        ElementSelectorDtoMapper elementSelectorDtoMapper
    ) {
        this.service = service;
        this.mapper = mapper;
        this.quantumOperationDtoMapper = quantumOperationDtoMapper;
        this.elementSelectorDtoMapper = elementSelectorDtoMapper;
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<CircuitResponse> getByProjectId(@PathVariable String projectId) {
        Optional<QuantumCircuit> circuit = service.getByProjectId(projectId);
        return circuit.map(mapper::toResponse).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/{projectId}")
    public CircuitResponse init(@PathVariable String projectId) {
        QuantumCircuit circuit = service.init(projectId);
        return mapper.toResponse(circuit);
    }

    @DeleteMapping("/{circuitId}")
    public void delete(@PathVariable String circuitId) {
        service.delete(circuitId);
    }

    @PostMapping("/{circuitId}/register/{registerId}")
    @ResponseStatus(HttpStatus.CREATED)
    public CircuitResponse addQubit(@PathVariable String circuitId, @PathVariable String registerId) {
        QuantumCircuit circuit = service.addQubit(circuitId, registerId);
        return mapper.toResponse(circuit);
    }

    @DeleteMapping("/{circuitId}/register/{registerId}/{qubitIdx}")
    public CircuitResponse removeQubit(@PathVariable String circuitId, @PathVariable String registerId, @PathVariable int qubitIdx) {
        QuantumCircuit circuit = service.removeQubit(circuitId, registerId, qubitIdx);
        return mapper.toResponse(circuit);
    }

    @PostMapping("/{circuitId}/operation")
    @ResponseStatus(HttpStatus.CREATED)
    public CircuitResponse addQuantumOperation(@PathVariable String circuitId, @RequestBody AddQuantumOperationRequest request) {
        QuantumOperation operation = quantumOperationDtoMapper.toDomain(request.quantumOperation());
        QuantumCircuit circuit = service.addQuantumOperation(circuitId, operation, request.layerIdx());
        return mapper.toResponse(circuit);
    }

    @PatchMapping("/{circuitId}/operation")
    public CircuitResponse moveQuantumOperation(@PathVariable String circuitId, @RequestBody MoveQuantumOperationRequest request) {
        List<ElementSelector> targetQubits = request.targetQubits().stream().map(elementSelectorDtoMapper::toDomain).toList();
        List<ElementSelector> controlQubits = request.controlQubits().stream().map(elementSelectorDtoMapper::toDomain).toList();
        QuantumCircuit circuit = service.moveQuantumOperation(
            circuitId,
            request.quantumOperationId(),
            request.layerIdx(),
            targetQubits,
            controlQubits
        );
        return mapper.toResponse(circuit);
    }

    @DeleteMapping("/{circuitId}/operation/{operationId}")
    public CircuitResponse removeQuantumOperation(@PathVariable String circuitId, @PathVariable String operationId) {
        QuantumCircuit circuit = service.removeQuantumOperation(circuitId, operationId);
        return mapper.toResponse(circuit);
    }
}
