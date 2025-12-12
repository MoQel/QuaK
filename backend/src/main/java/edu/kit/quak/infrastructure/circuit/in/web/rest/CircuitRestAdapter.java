package edu.kit.quak.infrastructure.circuit.in.web.rest;

import edu.kit.quak.application.ports.in.CircuitServicePort;
import edu.kit.quak.core.circuit.model.QuantumCircuit;
import edu.kit.quak.infrastructure.circuit.in.web.rest.dto.CircuitResponse;
import edu.kit.quak.infrastructure.circuit.in.web.rest.mapper.CircuitDtoMapper;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

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

    @PostMapping("/qubit/add")
    @ResponseStatus(HttpStatus.CREATED)
    public CircuitResponse addQubit() {
        QuantumCircuit quantumCircuit = service.addQubit();
        return mapper.toResponse(quantumCircuit);
    }
}