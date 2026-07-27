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
