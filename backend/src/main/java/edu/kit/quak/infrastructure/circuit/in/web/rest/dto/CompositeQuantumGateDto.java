package edu.kit.quak.infrastructure.circuit.in.web.rest.dto;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

/**
 * A call to a user-defined gate, rendered as one box instead of its elementary gates.
 *
 * <p>{@code identifier} carries the gate's own name (e.g. {@code "bell"}) rather than a library
 * constant, which is why {@code type} is what distinguishes this from an elementary gate.
 */
@Getter
@Setter
public class CompositeQuantumGateDto extends QuantumOperationDto {

    /** Port labels in the same order as {@code targetQubits}, e.g. {@code ["a", "b"]}. */
    private List<String> portLabels;

    /**
     * Positions in {@code targetQubits} the gate body actually acts on. A declared but unused
     * parameter is absent, so its wire can be drawn as passing through rather than as a port.
     */
    private List<Integer> usedQubitPositions;

    /** What the gate is made of, one level deep and already bound to this call's qubits. */
    private List<QuantumOperationDto> body;

    public CompositeQuantumGateDto(
        String id,
        String identifier,
        boolean inverseForm,
        List<ElementSelectorDto> targetQubits,
        List<ElementSelectorDto> controlQubits,
        List<String> portLabels,
        List<Integer> usedQubitPositions,
        List<QuantumOperationDto> body
    ) {
        super(id, identifier, inverseForm, targetQubits, controlQubits);
        this.portLabels = portLabels;
        this.usedQubitPositions = usedQubitPositions;
        this.body = body;
    }
}
