package edu.kit.quak.infrastructure.circuit.in.web.rest;

import edu.kit.quak.application.ports.in.CircuitServicePort;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.CircuitResponse;
import edu.kit.quak.infrastructure.circuit.in.web.rest.mapper.CircuitDtoMapper;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/circuit")
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
        QuantumCircuit quantumCircuit = service.init();
        return mapper.toResponse(quantumCircuit);
    }

    @GetMapping("/{circuitId}")
    public CircuitResponse get(@PathVariable String circuitId) {
        QuantumCircuit quantumCircuit = service.get(circuitId);
        return mapper.toResponse(quantumCircuit);
    }

    @DeleteMapping("/{circuitId}")
    public void delete(@PathVariable String circuitId) {
        service.delete(circuitId);
    }

    @PostMapping("/{circuitId}/qubit")
    @ResponseStatus(HttpStatus.CREATED)
    public CircuitResponse addQubit(@PathVariable String circuitId) {
        QuantumCircuit quantumCircuit = service.addQubit(circuitId);
        return mapper.toResponse(quantumCircuit);
    }

    @DeleteMapping("/{circuitId}/qubit/{registerId}")
    public CircuitResponse deleteQubit(@PathVariable String circuitId,
                                       @PathVariable String registerId) {
        QuantumCircuit quantumCircuit = service.deleteQubit(circuitId, registerId);
        return mapper.toResponse(quantumCircuit);
    }
}