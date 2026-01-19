package edu.kit.quak.infrastructure.circuit.in.web.rest.dto;

public record AddGateRequest(
        String definitionId,
        int toQubitIdx,
        int toPositionIdx
) {
}