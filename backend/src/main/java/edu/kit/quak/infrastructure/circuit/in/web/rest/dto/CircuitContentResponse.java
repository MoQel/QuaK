package edu.kit.quak.infrastructure.circuit.in.web.rest.dto;

import java.util.List;

/**
 * Circuit content without identity (no circuitId/projectId/fileId). Used by the
 * stateless code endpoints: parsing OpenQASM yields plain content the client
 * merges into its active circuit.
 */
public record CircuitContentResponse(List<RegisterResponse> registers, List<LayerResponse> layers, List<LoopBlockDto> loopBlocks) {}
