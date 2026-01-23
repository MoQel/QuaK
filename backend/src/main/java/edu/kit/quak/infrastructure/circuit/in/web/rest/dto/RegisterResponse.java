package edu.kit.quak.infrastructure.circuit.in.web.rest.dto;

import java.util.List;

public record RegisterResponse(String id, String name, List<QubitResponse> qubits) {}
