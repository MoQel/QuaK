package edu.kit.quak.core.circuit.model;

/**
 * A circuit offered as a subcircuit, as the editor's library needs it.
 *
 * @param circuitId what a call stores in {@code definitionCircuitId}
 * @param name the file the circuit belongs to, which is what the box is labelled with
 * @param qubitCount how many wires the box will cover
 */
public record SubcircuitOption(String circuitId, String name, int qubitCount) {}
