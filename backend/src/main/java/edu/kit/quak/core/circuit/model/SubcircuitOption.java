package edu.kit.quak.core.circuit.model;

/**
 * A circuit offered as a subcircuit, as the editor's library needs it.
 *
 * @param circuitId what a call stores in {@code definitionCircuitId}
 * @param fileId the file holding it, so the editor can open it for editing
 * @param name the file the circuit belongs to, which is what the box is labelled with
 * @param qubitCount how many wires the box will cover
 * @param operationCount how much is in it; zero means a circuit that exists but does nothing yet,
 *     which the library marks rather than hides - it is usually one the user is still building
 */
public record SubcircuitOption(String circuitId, String fileId, String name, int qubitCount, int operationCount) {}
