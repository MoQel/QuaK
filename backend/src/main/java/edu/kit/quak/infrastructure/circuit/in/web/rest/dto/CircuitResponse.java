package edu.kit.quak.infrastructure.circuit.in.web.rest.dto;

import java.util.List;

public record CircuitResponse(
        List<QubitResponse> qubits
) {
}