package edu.kit.quak.core.qrisp.model;

import edu.kit.quak.core.qrisp.exceptions.InvalidQrispProgramException;
import lombok.NonNull;

/**
 * A number OR a constant reference.
 *
 * <p>Used wherever Qrisp code may write either a literal or a constant name, e.g. the size in
 * {@code QuantumVariable(3)} or {@code QuantumVariable(n)}.
 * <b>Exactly one</b> of the two fields is set.
 *
 * <p>Note: integers and floats are not told apart: e.g. {@code 3} and {@code 3.0} are the same value.
 *
 * @param number the literal, or {@code null} if the value is a constant
 * @param constantId the id of a {@link ClassicalConstant}, or {@code null} if the value is a literal
 */
public record Value(Double number, String constantId) {
    public Value {
        if (number != null && constantId != null) {
            throw new InvalidQrispProgramException("A value is either a number or a constant, but this one is both.");
        }
        if (number == null && constantId == null) {
            throw new InvalidQrispProgramException("A value must be a number or a constant, but this one is neither.");
        }
    }

    public static Value of(double number) {
        return new Value(number, null);
    }

    public static Value ofConstant(@NonNull String constantId) {
        return new Value(null, constantId);
    }
}
