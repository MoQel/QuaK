package edu.kit.quak.infrastructure.circuit.in.web.rest.dto;

import java.util.List;

public record CircuitResponse(String id, List<RegisterResponse> registers, List<LayerResponse> layers) {}
