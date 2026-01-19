package edu.kit.quak.infrastructure.circuit.in.web.rest.dto;

import edu.kit.quak.core.circuit.model.operation.ElementaryQuantumGateDefinitionIdentifier;

public record GateResponse(
        String id,
        ElementaryQuantumGateDefinitionIdentifier definitionId
) {
}