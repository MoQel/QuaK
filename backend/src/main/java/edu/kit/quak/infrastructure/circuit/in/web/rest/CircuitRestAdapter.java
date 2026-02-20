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
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@Slf4j
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

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CircuitResponse init() {
        log.info("REST request to initialize new circuit");
        QuantumCircuit circuit = service.init();
        return mapper.toResponse(circuit);
    }

    @GetMapping("/{circuitId}")
    public CircuitResponse get(@PathVariable String circuitId) {
        log.debug("REST request to get circuit: {}", circuitId);
        QuantumCircuit circuit = service.get(circuitId);
        return mapper.toResponse(circuit);
    }

    @DeleteMapping("/{circuitId}")
    public void delete(@PathVariable String circuitId) {
        log.info("REST request to delete circuit: {}", circuitId);
        service.delete(circuitId);
    }

    @PostMapping("/{circuitId}/register/{registerId}")
    @ResponseStatus(HttpStatus.CREATED)
    public CircuitResponse addQubit(@PathVariable String circuitId, @PathVariable String registerId) {
        log.info("REST request to add qubit to register '{}' in circuit '{}'", registerId, circuitId);
        QuantumCircuit circuit = service.addQubit(circuitId, registerId);
        return mapper.toResponse(circuit);
    }

    @DeleteMapping("/{circuitId}/register/{registerId}/{qubitIdx}")
    public CircuitResponse removeQubit(@PathVariable String circuitId, @PathVariable String registerId, @PathVariable int qubitIdx) {
        log.info("REST request to remove qubit at index {} from register '{}' in circuit '{}'", qubitIdx, registerId, circuitId);
        QuantumCircuit circuit = service.removeQubit(circuitId, registerId, qubitIdx);
        return mapper.toResponse(circuit);
    }

    @PostMapping("/{circuitId}/operation")
    @ResponseStatus(HttpStatus.CREATED)
    public CircuitResponse addQuantumOperation(@PathVariable String circuitId, @RequestBody AddQuantumOperationRequest request) {
        log.info("REST request to add operation to circuit '{}' at layer {}", circuitId, request.layerIdx());
        QuantumOperation operation = quantumOperationDtoMapper.toDomain(request.quantumOperation());
        QuantumCircuit circuit = service.addQuantumOperation(circuitId, operation, request.layerIdx());
        return mapper.toResponse(circuit);
    }

    @PatchMapping("/{circuitId}/operation")
    public CircuitResponse moveQuantumOperation(@PathVariable String circuitId, @RequestBody MoveQuantumOperationRequest request) {
        log.info(
            "REST request to move operation '{}' in circuit '{}' to layer {}",
            request.quantumOperationId(),
            circuitId,
            request.layerIdx()
        );
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
        log.info("REST request to remove operation '{}' from circuit '{}'", operationId, circuitId);
        QuantumCircuit circuit = service.removeQuantumOperation(circuitId, operationId);
        return mapper.toResponse(circuit);
    }
}
