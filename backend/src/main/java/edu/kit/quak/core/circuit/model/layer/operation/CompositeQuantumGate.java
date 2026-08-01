package edu.kit.quak.core.circuit.model.layer.operation;

import edu.kit.quak.core.circuit.exceptions.InvalidOperationConfigurationException;
import edu.kit.quak.core.circuit.model.gate.GateDefinition;
import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
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

    /**
     * Rebuilds a call — definition included — from a body that is already bound to the call's qubits.
     *
     * <p>This is how a composite is read back from a request or from the database, neither of which
     * carries the definition's formal body. It works because a call may not pass the same qubit
     * twice (the constructor rejects that): the binding formal → actual is injective, so the
     * <em>position</em> of a qubit in {@code qubits} is exactly the parameter it stands for, and the
     * mapping can be inverted. A nested composite in the body is rebuilt the same way beforehand and
     * simply gets rebound here.
     *
     * @param parameterNames the port labels, which also fix the arity
     * @param qubits the call's qubits in parameter order
     * @param boundBody the body in program order, addressing {@code qubits}
     */
    public static CompositeQuantumGate fromBoundBody(
        @NonNull String gateName,
        @NonNull List<String> parameterNames,
        boolean inverseForm,
        @NonNull List<ElementSelector> qubits,
        @NonNull List<QuantumOperation> boundBody
    ) {
        GateDefinition definition = new GateDefinition(gateName, parameterNames);
        // Built first so arity and distinctness are validated before the inversion relies on them.
        CompositeQuantumGate call = new CompositeQuantumGate(definition, inverseForm, qubits);

        Map<ElementSelector, Integer> parameterOfQubit = new HashMap<>();
        for (int position = 0; position < qubits.size(); position++) {
            parameterOfQubit.put(qubits.get(position), position);
        }

        for (QuantumOperation operation : boundBody) {
            definition.addOperation(
                operation.copyForQubits(
                    toFormalSelectors(definition, parameterOfQubit, operation.getTargetQubits()),
                    toFormalSelectors(definition, parameterOfQubit, operation.getControlQubits())
                )
            );
        }
        return call;
    }

    /** Maps qubits of the call back onto the definition's formal parameters. */
    private static List<ElementSelector> toFormalSelectors(
        GateDefinition definition,
        Map<ElementSelector, Integer> parameterOfQubit,
        List<ElementSelector> boundSelectors
    ) {
        if (boundSelectors == null) {
            return new ArrayList<>();
        }
        List<ElementSelector> formal = new ArrayList<>(boundSelectors.size());
        for (ElementSelector selector : boundSelectors) {
            Integer parameter = parameterOfQubit.get(selector);
            if (parameter == null) {
                // Only possible from a malformed payload: a body operation may never reach a qubit
                // outside the gate's own parameters.
                throw new InvalidOperationConfigurationException(
                    "The body of gate '%s' acts on a qubit that the call does not pass.".formatted(definition.getName())
                );
            }
            formal.add(definition.selectorFor(parameter));
        }
        return formal;
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
     * The qubits the body actually acts on, as opposed to every qubit the call binds. A parameter a
     * definition never uses (e.g. {@code b} in {@code gate foo a, b, c { h a; cx a, c; }}) still
     * occupies its wire, it just leaves it unchanged.
     *
     * <p>This is analysis information, not a rendering rule: the editor deliberately draws a port
     * for <em>every</em> declared parameter so a box shows the gate's full signature.
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

    /**
     * Two calls match when they run the same definition on the same qubits.
     *
     * <p>Comparing the definition by id rather than by content is exact here, not an approximation:
     * the parser caches definitions by gate name <em>plus arguments</em>, so two calls share one
     * instance precisely when the gate and its parameters agree. A gate parametrized by a loop
     * counter therefore yields a different definition per iteration and correctly compares unequal.
     */
    @Override
    public boolean isStructurallyEqualTo(QuantumOperation other) {
        return super.isStructurallyEqualTo(other) && definition.getId().equals(((CompositeQuantumGate) other).definition.getId());
    }

    @Override
    public String toString() {
        return String.format("[CompositeQuantumGate: %s (quantumOperationId=%s)]", getGateName(), getId());
    }
}
