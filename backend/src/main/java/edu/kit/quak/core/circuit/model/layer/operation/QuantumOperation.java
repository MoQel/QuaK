package edu.kit.quak.core.circuit.model.layer.operation;

import static java.util.stream.Collectors.toCollection;

import edu.kit.quak.core.circuit.exceptions.InvalidOperationConfigurationException;
import edu.kit.quak.core.circuit.model.ElementWithId;
import edu.kit.quak.core.circuit.model.layer.operation.library.QuantumOperationLibrary;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NonNull;
import lombok.Setter;

@Getter
@Setter
public abstract class QuantumOperation extends ElementWithId {

    protected QuantumOperationLibrary operationDefinition;
    protected boolean inverseForm;
    protected List<ElementSelector> targetQubits;
    protected List<ElementSelector> controlQubits;

    protected QuantumOperation(
        @NonNull QuantumOperationLibrary operationDefinition,
        boolean inverseForm,
        @NonNull List<ElementSelector> targetQubits,
        List<ElementSelector> controlQubits
    ) {
        super();
        this.operationDefinition = operationDefinition;
        this.inverseForm = inverseForm;
        if (targetQubits.isEmpty()) {
            throw new InvalidOperationConfigurationException("Must provide at least one qubit to target.");
        }
        this.targetQubits = targetQubits;
        this.controlQubits = controlQubits;
    }

    /**
     * Returns a copy of this operation acting on different qubits, keeping everything else (gate
     * type, inverse flag, rotation angle, ...) untouched.
     *
     * <p>This is what instantiates the body of a {@code GateDefinition} at a call site: the body is
     * written against the definition's formal qubits and has to be rebound to the actual ones. It is
     * polymorphic rather than a type switch so that a future composite operation only has to
     * implement it, instead of every caller learning about a new subclass.
     *
     * <p>Implementations must not share {@link ElementSelector} instances with the original —
     * selectors are mutable (see {@link ElementSelector#decreaseIndex()}), so a shared one would let
     * a qubit removal corrupt an unrelated operation.
     */
    public abstract QuantumOperation copyForQubits(
        @NonNull List<ElementSelector> targetQubits,
        @NonNull List<ElementSelector> controlQubits
    );

    /**
     * Whether two operations do the same thing to the same qubits — everything that defines the
     * operation, except its identity.
     *
     * <p>This is what lets the QASM parser decide whether a loop is a genuine repetition: it unrolls
     * the loop and compares what each iteration emitted against the first one. Equal means the loop
     * variable never reached the gates, so the body can be kept once and framed with a repeat count;
     * unequal means every pass touches different wires (or angles) and the loop stays unrolled.
     *
     * <p>Polymorphic for the same reason as {@link #copyForQubits}: a new operation type only has to
     * say what makes it equal, instead of every caller learning about it. Deliberately not
     * {@code equals}, which stays identity-based — two distinct rows in a circuit may well have the
     * same effect and must not collapse into one in a set or map.
     */
    public boolean isStructurallyEqualTo(QuantumOperation other) {
        return (
            other != null &&
            getClass() == other.getClass() &&
            operationDefinition == other.operationDefinition &&
            inverseForm == other.inverseForm &&
            selectorsEqual(targetQubits, other.targetQubits) &&
            selectorsEqual(controlQubits, other.controlQubits)
        );
    }

    /** Compares selector lists treating null and empty as the same thing, which callers mix freely. */
    protected static boolean selectorsEqual(List<ElementSelector> a, List<ElementSelector> b) {
        return (a == null ? List.<ElementSelector>of() : a).equals(b == null ? List.<ElementSelector>of() : b);
    }

    /** Defensive copy of a selector list, so callers never alias the originals. */
    protected static List<ElementSelector> copySelectors(List<ElementSelector> selectors) {
        if (selectors == null) {
            return new ArrayList<>();
        }
        return selectors
            .stream()
            .map(selector -> new ElementSelector(selector.getRegisterId(), selector.getIndex()))
            .collect(toCollection(ArrayList::new));
    }
}
