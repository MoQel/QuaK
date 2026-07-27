package edu.kit.quak.core.circuit.model.layer.operation.library;

import edu.kit.quak.core.circuit.model.layer.operation.CompositeQuantumGate;

/**
 * Library entry for user-defined gates.
 *
 * <p>Unlike a {@link ConcreteQuantumOperation}, a composite has no fixed shape: how many qubits it
 * takes follows from the {@code GateDefinition} behind each individual call, so the qubit counts
 * this definition carries are reported as 0 rather than a made-up number that callers might trust.
 * Use {@code CompositeQuantumGate.getDefinition().getArity()} for the real arity.
 */
public class CompositeQuantumOperation extends QuantumOperationDefinition<CompositeQuantumGate> {

    protected CompositeQuantumOperation() {
        super(CompositeQuantumGate.class, true, 0, 0);
    }

    /** Composites are variable-arity, so the inherited qubit counts carry no information. */
    public boolean hasFixedArity() {
        return false;
    }
}
