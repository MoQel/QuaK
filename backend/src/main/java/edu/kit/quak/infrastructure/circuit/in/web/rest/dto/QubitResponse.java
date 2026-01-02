package edu.kit.quak.infrastructure.circuit.in.web.rest.dto;

import java.util.List;

public record QubitResponse(
        String id,
        String name,
        List<GateResponse> gates
) {
    // Ensure gates list is not null
    public QubitResponse {
        if (gates == null) {
            gates = List.of();
        }
    }
}