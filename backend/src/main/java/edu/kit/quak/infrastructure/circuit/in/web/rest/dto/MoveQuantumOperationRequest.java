package edu.kit.quak.infrastructure.circuit.in.web.rest.dto;

import java.util.List;

public record MoveQuantumOperationRequest(
        String quantumOperationId,
        int layerIdx,
        List<ElementSelectorDto> targetQubits,
        List<ElementSelectorDto> controlQubits) {}
