package edu.kit.quak.infrastructure.circuit.in.web.rest.dto;

public record MoveGateRequest(
        String id,
        int toQubitIdx,
        int toPositionIdx
) {
}