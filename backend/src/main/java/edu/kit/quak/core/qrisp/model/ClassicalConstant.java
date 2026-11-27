package edu.kit.quak.core.qrisp.model;

import lombok.Getter;
import lombok.NonNull;

/**
 * A named number at the top of a program, e.g. {@code n = 3} or {@code angle = 0.5}.
 *
 * <p>"Classical" here means it is an ordinary number on a normal computer, not something stored in
 * qubits. Other parts of the program refer to it through a {@link Value}.
 */
@Getter
public class ClassicalConstant {

    private final String id;
    private final String name;
    private final double value;

    public ClassicalConstant(@NonNull String id, @NonNull String name, double value) {
        this.id = id;
        this.name = name;
        this.value = value;
    }
}
