package edu.kit.quak.core.circuit.model.register;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Discriminator for the two register types in the CoQuaDe meta-model.
 * <p>
 * The JSON representation matches the {@code @JsonSubTypes} discriminator values
 * used in {@code RegisterResponse} so that frontend and backend use the same
 * string constants.
 */
public enum RegisterType {
    QUANTUM("Quantum_Register"),
    CLASSIC("Classic_Register");

    private final String jsonValue;

    RegisterType(String jsonValue) {
        this.jsonValue = jsonValue;
    }

    /**
     * Returns the JSON discriminator value used for serialization
     * (e.g., {@code "Quantum_Register"} or {@code "Classic_Register"}).
     */
    @JsonValue
    public String getJsonValue() {
        return jsonValue;
    }

    /**
     * Deserializes a JSON discriminator string back to the enum.
     *
     * @param value the JSON string (e.g., {@code "Quantum_Register"})
     * @return the matching {@code RegisterType}
     * @throws IllegalArgumentException if the value does not match any known type
     */
    @JsonCreator
    public static RegisterType fromJsonValue(String value) {
        for (RegisterType type : values()) {
            if (type.jsonValue.equals(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown register type: " + value);
    }

    @Override
    public String toString() {
        return jsonValue;
    }
}
