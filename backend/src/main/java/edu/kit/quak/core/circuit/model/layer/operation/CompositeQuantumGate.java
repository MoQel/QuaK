package edu.kit.quak.core.circuit.model.layer.operation;

import edu.kit.quak.core.circuit.exceptions.InvalidOperationConfigurationException;
import edu.kit.quak.core.circuit.model.gate.GateDefinition;
import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import lombok.Getter;
import lombok.NonNull;

/**
 * A call to a user-defined gate — the {@code bell q[0], q[1];} that the editor renders as a single
 * box spanning the involved wires, instead of the elementary gates it expands to.
 *
 * <p>The qubits are held in {@link #getTargetQubits()} in the definition's <em>parameter order</em>,
 * so position <em>i</em> is the wire bound to port {@code definition.getParameterName(i)}. A
 * composite has no controls of its own; a controlled composite would be a gate modifier, which the
 * parser rejects for now.
 *
 * <p>Because this is an ordinary {@link QuantumOperation}, it can sit in a circuit layer as well as
 * inside another gate's body — which is what keeps nesting visible instead of flattening
 * {@code bell3} into its elementary gates.
 */
public class CompositeQuantumGate extends QuantumOperation {

    /** The gate this call refers to; the source of the body, the port labels and the arity. */
    @Getter
    private final GateDefinition definition;

    public CompositeQuantumGate(@NonNull GateDefinition definition, boolean inverseForm, @NonNull List<ElementSelector> qubits) {
        super(QuantumOperationLibrary.COMPOSITE, inverseForm, new ArrayList<>(qubits), new ArrayList<>());
        if (qubits.size() != definition.getArity()) {
            throw new InvalidOperationConfigurationException(
                "Gate '%s' expects %d qubit(s) but got %d.".formatted(definition.getName(), definition.getArity(), qubits.size())
            );
        }
        if (new HashSet<>(qubits).size() != qubits.size()) {
            throw new InvalidOperationConfigurationException(
                "Gate '%s' was called with the same qubit more than once.".formatted(definition.getName())
            );
        }
        this.definition = definition;
    }

    /** Display name of the box, e.g. {@code "bell"}. */
    public String getGateName() {
        return definition.getName();
    }

    /** Port label of the wire at the given position, e.g. {@code "a"} for the topmost of {@code bell}. */
    public String getPortLabel(int qubitPosition) {
        return definition.getParameterName(qubitPosition);
    }

    /**
     * The gates this gate is made of, bound to the qubits of this call — one level deep, so a nested
     * composite stays a composite. This is what an "ungroup" action drops into the circuit, and what
     * an inspector shows as the box's contents.
     */
    public List<QuantumOperation> expand() {
        return definition.instantiate(getTargetQubits());
    }

    /**
     * Expands recursively until only elementary operations remain — the form the simulator and the
     * code generator need. Termination is guaranteed because {@link GateDefinition} rejects a body
     * that would make a definition contain itself.
     */
    public List<QuantumOperation> expandToElementary() {
        List<QuantumOperation> elementary = new ArrayList<>();
        for (QuantumOperation operation : expand()) {
            if (operation instanceof CompositeQuantumGate nested) {
                elementary.addAll(nested.expandToElementary());
            } else {
                elementary.add(operation);
            }
        }
        return elementary;
    }

    /**
     * The qubits the body actually acts on, as opposed to every qubit the box spans. A parameter a
     * definition never uses (e.g. {@code b} in {@code gate foo a, b, c { h a; cx a, c; }}) leaves its
     * wire untouched, and the editor should draw it as passing through rather than as a port.
     */
    public List<ElementSelector> getUsedQubits() {
        List<ElementSelector> qubits = getTargetQubits();
        return definition.getUsedParameterIndices().stream().map(qubits::get).toList();
    }

    @Override
    public CompositeQuantumGate copyForQubits(@NonNull List<ElementSelector> targetQubits, @NonNull List<ElementSelector> controlQubits) {
        if (!controlQubits.isEmpty()) {
            throw new InvalidOperationConfigurationException(
                "Gate '%s' is a composite and cannot carry control qubits.".formatted(getGateName())
            );
        }
        return new CompositeQuantumGate(definition, inverseForm, copySelectors(targetQubits));
    }

    @Override
    public String toString() {
        return String.format("[CompositeQuantumGate: %s (quantumOperationId=%s)]", getGateName(), getId());
    }
}
