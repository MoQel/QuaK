package edu.kit.quak.infrastructure.circuit.in.web.rest.dto;

/**
 * A circuit of the project offered as a subcircuit, for the editor's library.
 *
 * @param circuitId what a call stores in {@code definitionCircuitId}
 * @param name the file the circuit belongs to; the label of the box
 * @param qubitCount how many wires a call of it covers
 */
public record SubcircuitOptionResponse(String circuitId, String name, int qubitCount) {}
