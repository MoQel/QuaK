package edu.kit.quak.infrastructure.circuit.in.web.rest.dto;

/**
 * Request DTO for creating a new register (QuantumRegister or ClassicRegister).
 *
 * @param name the human-readable register name (e.g., "q", "c", "a")
 * @param type the register type discriminator ("Quantum_Register" or "Classic_Register")
 * @param size the initial number of qubits (for QuantumRegister) or bits (for ClassicRegister)
 */
public record RegisterRequest(String name, String type, int size) {}
