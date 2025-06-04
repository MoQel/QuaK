package edu.kit.quak.files.model;

import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Optional;

public enum Type {
    DIRECTORY("directory", 'd'),
    FILE("file", 'f'),
    PROJECT("project", 'p');

    @JsonValue
    public final String name;
    private final char prefix;

    Type(String name, char prefix) {
        this.name = name;
        this.prefix = prefix;
    }

    public String toId(Object id) {
        return prefix + id.toString();
    }

    @Override
    public String toString() {
        return name;
    }

    public static Optional<Type> getTypeByName(String name) {
        for (Type value : values()) {
            if (value.name.equals(name))
                return Optional.of(value);
        }
        return Optional.empty();
    }

    public static Optional<Type> getTypeForId(String id) {
        for (Type value : values()) {
            if (id.charAt(0) == value.prefix) {
                return Optional.of(value);
            }
        }
        return Optional.empty();
    }
}
