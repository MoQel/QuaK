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

    @PostMapping("/init")
    @ResponseStatus(HttpStatus.CREATED)
    public CircuitResponse initCircuit() {
        QuantumCircuit quantumCircuit = service.initCircuit();
        return mapper.toResponse(quantumCircuit);
    }

    @GetMapping("/{id}")
    public CircuitResponse getCircuit(@PathVariable String id) {
        QuantumCircuit quantumCircuit = service.getCircuit(id);
        return mapper.toResponse(quantumCircuit);
    }

    @PostMapping("/qubit/add/{id}")
    @ResponseStatus(HttpStatus.CREATED)
    public CircuitResponse addQubit(@PathVariable String id) {
        QuantumCircuit quantumCircuit = service.addQubit(id);
        return mapper.toResponse(quantumCircuit);
    }
}