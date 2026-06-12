package edu.kit.quak.infrastructure.circuit.in.web.rest.dto;

import java.util.List;

/** Full-replace payload for a circuit: new registers and layers, identity stays untouched. */
public record UpdateCircuitRequest(List<RegisterResponse> registers, List<LayerResponse> layers) {}
