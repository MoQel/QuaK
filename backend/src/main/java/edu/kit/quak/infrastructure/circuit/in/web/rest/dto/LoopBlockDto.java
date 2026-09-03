package edu.kit.quak.infrastructure.circuit.in.web.rest.dto;

import java.util.List;

/**
 * A repetition frame: the {@code ×n} box the editor draws <em>around</em> part of the circuit.
 *
 * <p>Unlike a composite gate this is not an operation and does not live in a layer — the operations
 * it covers stay in their layers and stay individually editable. The frame's position is therefore
 * not transmitted at all: the client derives it as the bounding box of {@code operationIds},
 * wherever those operations currently sit.
 *
 * @param operationIds the covered operations in program order, referencing ids in {@code layers}
 */
public record LoopBlockDto(String id, int repeatCount, List<String> operationIds) {}
