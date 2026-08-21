package edu.kit.quak.infrastructure.circuit.in.web.rest.dto;

/**
 * A circuit of the project offered as a subcircuit, for the editor's library.
 *
 * @param circuitId what a call stores in {@code definitionCircuitId}
 * @param fileId the file holding it, so the editor can open it
 * @param name the file the circuit belongs to; the label of the box
 * @param qubitCount how many wires a call of it covers
 * @param operationCount how much is in it; zero marks a circuit that is still empty
 */
public record SubcircuitOptionResponse(String circuitId, String fileId, String name, int qubitCount, int operationCount) {}
