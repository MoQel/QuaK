package edu.kit.quak.infrastructure.circuit.in.web.rest.dto;

import edu.kit.quak.core.circuit.model.register.RegisterType;

/**
 * Request DTO for creating a new register (QuantumRegister or ClassicRegister).
 *
 * @param name the human-readable register name (e.g., "q", "c", "a")
 * @param type the register type discriminator ({@link RegisterType#QUANTUM} or {@link RegisterType#CLASSIC})
 * @param size the initial number of qubits (for QuantumRegister) or bits (for ClassicRegister)
 */
public record RegisterRequest(String name, RegisterType type, int size) {}
