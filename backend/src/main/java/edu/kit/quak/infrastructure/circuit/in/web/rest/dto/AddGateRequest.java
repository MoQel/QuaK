package edu.kit.quak.infrastructure.circuit.in.web.rest.dto;

public record AddGateRequest(
        String type,
        int toQubitIdx,
        int toPositionIdx
) {
}