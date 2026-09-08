package edu.kit.quak.core.circuit.model.gate;

import edu.kit.quak.core.circuit.exceptions.InvalidOperationConfigurationException;
import edu.kit.quak.core.circuit.model.ElementWithId;
import edu.kit.quak.core.circuit.model.layer.operation.CompositeQuantumGate;
import edu.kit.quak.core.circuit.model.layer.operation.ElementSelector;
import edu.kit.quak.core.circuit.model.layer.operation.QuantumOperation;
import edu.kit.quak.core.circuit.model.register.QuantumRegister;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.Getter;
import lombok.NonNull;

/**
 * A user-defined gate: the counterpart of an OpenQASM {@code gate bell a, b { h a; cx a, b; }}
 * declaration. It is the container that holds the elementary gates a composite gate is built from,
 * so the circuit can show {@code bell} as one box instead of its expansion.
 *
 * <h2>How the body addresses qubits</h2>
 *
 * A gate body is written against <em>formal</em> qubits ({@code a}, {@code b}) which are not part of
 * any register — but {@link ElementSelector}, and therefore every existing operation, always points
 * at a register. Rather than introduce a second kind of selector (which every consumer of a circuit
 * would have to learn about), a definition owns a private {@link QuantumRegister} whose qubits
 * <em>are</em> the formal parameters, one wire per parameter in declaration order. Body operations
 * are then ordinary operations selecting into that register, and {@link #parameterNames} carries the
 * labels shown on the box's ports.
 *
 * <h2>Why the body is flat</h2>
 *
 * The body is an ordered statement sequence, exactly as written, not a layered layout. Layering is a
 * rendering concern that the circuit's own ASAP scheduler derives once the body is expanded, so
 * storing layers here would duplicate that logic and could disagree with it.
 *
 * <p>Instantiating a definition at a call site is {@link #instantiate(List)}, which is the single
 * operation that "ungroup", simulation, and code generation all build on.
 */
public class GateDefinition extends ElementWithId {

    @Getter
    private final String name;

    /** Formal qubit parameter names in declaration order; these label the ports of the rendered box. */
    private final List<String> parameterNames;

    /** Carrier register the body's selectors point into. One qubit per formal parameter. */
    @Getter
    private final QuantumRegister formalQubits;

    private final List<QuantumOperation> body = new ArrayList<>();

    public GateDefinition(@NonNull String name, @NonNull List<String> parameterNames) {
        super();
        if (name.isBlank()) {
            throw new InvalidOperationConfigurationException("A gate definition needs a name.");
        }
        if (parameterNames.isEmpty()) {
            throw new InvalidOperationConfigurationException("Gate '%s' must declare at least one qubit parameter.".formatted(name));
        }
        if (new HashSet<>(parameterNames).size() != parameterNames.size()) {
            throw new InvalidOperationConfigurationException("Gate '%s' declares a qubit parameter more than once.".formatted(name));
        }

        this.name = name;
        this.parameterNames = List.copyOf(parameterNames);
        this.formalQubits = new QuantumRegister(name, parameterNames.size());
    }

    /** Number of qubits a call site has to supply. */
    public int getArity() {
        return parameterNames.size();
    }

    public List<String> getParameterNames() {
        return parameterNames;
    }

    /** Label of the given port, e.g. {@code "a"} for parameter 0 of {@code gate bell a, b}. */
    public String getParameterName(int parameterIndex) {
        requireValidParameter(parameterIndex);
        return parameterNames.get(parameterIndex);
    }

    /**
     * Selector addressing a formal qubit, for building the body. {@code selectorFor("a")} is what a
     * parser binds the operand {@code a} of {@code h a;} to.
     */
    public ElementSelector selectorFor(@NonNull String parameterName) {
        int index = parameterNames.indexOf(parameterName);
        if (index < 0) {
            throw new InvalidOperationConfigurationException(
                "Gate '%s' has no qubit parameter '%s'; declared are %s.".formatted(name, parameterName, parameterNames)
            );
        }
        return selectorFor(index);
    }

    public ElementSelector selectorFor(int parameterIndex) {
        requireValidParameter(parameterIndex);
        return new ElementSelector(formalQubits.getId(), parameterIndex);
    }

    public List<QuantumOperation> getBody() {
        return Collections.unmodifiableList(body);
    }

    /**
     * Indices of the parameters the body actually acts on, ascending. A declared but unused
     * parameter is missing here — in {@code gate foo a, b, c { h a; cx a, c; }} the wire bound to
     * {@code b} passes through untouched, and the editor should not draw a port for it.
     */
    public List<Integer> getUsedParameterIndices() {
        return body
            .stream()
            .flatMap(operation -> involvedQubits(operation).stream())
            .map(ElementSelector::getIndex)
            .distinct()
            .sorted()
            .toList();
    }

    /** Names of the parameters the body actually acts on, in declaration order. */
    public List<String> getUsedParameterNames() {
        return getUsedParameterIndices().stream().map(parameterNames::get).toList();
    }

    /**
     * Appends an operation to the gate body. The operation must address only this definition's
     * formal qubits — an operation reaching into a real register would silently make the gate depend
     * on the circuit it happens to be defined in, which is exactly the shadowing bug the QASM parser
     * already guards against.
     *
     * <p>A call to another gate is allowed and keeps its nesting, so a definition can be shown as
     * what it is built from. Only a call that would make this definition contain itself is rejected,
     * which is what lets the recursive expansion terminate.
     */
    public void addOperation(@NonNull QuantumOperation operation) {
        for (ElementSelector selector : involvedQubits(operation)) {
            requireFormalSelector(selector);
        }
        if (operation instanceof CompositeQuantumGate composite) {
            requireNoRecursion(composite.getDefinition());
        }
        body.add(operation);
    }

    /** True if this definition uses the given one, directly or through another gate. */
    public boolean dependsOn(@NonNull GateDefinition other) {
        return dependsOn(other, new HashSet<>());
    }

    private boolean dependsOn(GateDefinition other, Set<String> visited) {
        if (!visited.add(getId())) {
            return false;
        }
        for (QuantumOperation operation : body) {
            if (operation instanceof CompositeQuantumGate composite) {
                GateDefinition called = composite.getDefinition();
                if (called.getId().equals(other.getId()) || called.dependsOn(other, visited)) {
                    return true;
                }
            }
        }
        return false;
    }

    private void requireNoRecursion(GateDefinition called) {
        if (called.getId().equals(getId()) || called.dependsOn(this)) {
            throw new InvalidOperationConfigurationException(
                "Gate '%s' cannot use '%s': that would make the definition recursive.".formatted(name, called.getName())
            );
        }
    }

    /**
     * Expands this definition at a call site: every body operation is rebound from the formal qubits
     * to the actual ones, in body order. Parameter <em>i</em> becomes {@code actualQubits.get(i)}.
     *
     * <p>The result is a plain list of operations, so the caller can drop it into a circuit and let
     * the normal scheduler lay it out. That makes this method the shared basis for ungrouping a box
     * in the editor, decomposing it for the simulator, and emitting the expanded form as code.
     *
     * @param actualQubits the call site's qubits, in the definition's parameter order
     * @return freshly created operations; neither they nor their selectors alias the body
     */
    public List<QuantumOperation> instantiate(@NonNull List<ElementSelector> actualQubits) {
        if (actualQubits.size() != getArity()) {
            throw new InvalidOperationConfigurationException(
                "Gate '%s' expects %d qubit(s) but got %d.".formatted(name, getArity(), actualQubits.size())
            );
        }
        if (new HashSet<>(actualQubits).size() != actualQubits.size()) {
            // Binding two parameters to one wire would turn e.g. `cx a, b` into an invalid self-controlled gate.
            throw new InvalidOperationConfigurationException("Gate '%s' was called with the same qubit more than once.".formatted(name));
        }

        List<QuantumOperation> instantiated = new ArrayList<>(body.size());
        for (QuantumOperation operation : body) {
            instantiated.add(
                operation.copyForQubits(bind(operation.getTargetQubits(), actualQubits), bind(operation.getControlQubits(), actualQubits))
            );
        }
        return instantiated;
    }

    /** Maps formal selectors onto the call site's qubits. */
    private List<ElementSelector> bind(List<ElementSelector> formalSelectors, List<ElementSelector> actualQubits) {
        if (formalSelectors == null) {
            return new ArrayList<>();
        }
        List<ElementSelector> bound = new ArrayList<>(formalSelectors.size());
        for (ElementSelector formal : formalSelectors) {
            requireFormalSelector(formal);
            ElementSelector actual = actualQubits.get(formal.getIndex());
            // A fresh selector per operation: selectors are mutable and must never be shared.
            bound.add(new ElementSelector(actual.getRegisterId(), actual.getIndex()));
        }
        return bound;
    }

    private Set<ElementSelector> involvedQubits(QuantumOperation operation) {
        Set<ElementSelector> selectors = new HashSet<>(operation.getTargetQubits());
        if (operation.getControlQubits() != null) {
            selectors.addAll(operation.getControlQubits());
        }
        return selectors;
    }

    private void requireFormalSelector(ElementSelector selector) {
        if (!formalQubits.getId().equals(selector.getRegisterId())) {
            throw new InvalidOperationConfigurationException(
                "The body of gate '%s' may only use its own qubit parameters %s.".formatted(name, parameterNames)
            );
        }
        requireValidParameter(selector.getIndex());
    }

    private void requireValidParameter(int parameterIndex) {
        if (parameterIndex < 0 || parameterIndex >= parameterNames.size()) {
            throw new InvalidOperationConfigurationException(
                "Gate '%s' has %d qubit parameter(s), so index %d is out of range.".formatted(name, getArity(), parameterIndex)
            );
        }
    }

    @Override
    public String toString() {
        return "GateDefinition %s(%s) with %d operation(s)".formatted(name, String.join(", ", parameterNames), body.size());
    }
}
