package edu.kit.quak.core.qrisp.model.operation;

import java.util.Objects;

/**
 * Reference to the qubits a gate acts on: either one qubit of a variable, or the whole variable.
 *
 * <ul>
 *   <li>{@code h(a[0])} acts on one qubit: {@code QubitReference.qubit(aId, 0)}.</li>
 *   <li>{@code h(a)} acts on every qubit of {@code a}: {@code QubitReference.wholeVariable(aId)}.</li>
 * </ul>
 *
 * <p>Note: Whether the variable exists and the index is in range is checked by the validator, not here.
 * This allows collecting all errors in one pass instead of throwing an exception at the first one.
 *
 * @param variableId the id of the quantum variable
 * @param index the position of the qubit in the variable, or {@code null} for the whole variable
 */
public record QubitReference(String variableId, Integer index) {
    public QubitReference {
        Objects.requireNonNull(variableId, "A qubit reference must have a variable id");
    }

    /** One qubit of a variable, e.g. {@code a[0]}. */
    public static QubitReference qubit(String variableId, int index) {
        return new QubitReference(variableId, index);
    }

    /** All qubits of a variable, e.g. {@code a}. */
    public static QubitReference wholeVariable(String variableId) {
        return new QubitReference(variableId, null);
    }

    public boolean isWholeVariable() {
        return index == null;
    }
}
