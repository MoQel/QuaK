package edu.kit.quak.files.model;

import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Optional;

public enum Type {
    DIRECTORY("directory", 'd', Directory.class),
    FILE("file", 'f', File.class),
    PROJECT("project", 'p', Project.class);

    @JsonValue
    public final String name;
    private final char prefix;
    private final Class<? extends FileElement<?>> relatedClass;

    Type(String name, char prefix, Class<? extends FileElement<?>> relatedClass) {
        this.name = name;
        this.prefix = prefix;
        this.relatedClass = relatedClass;
    }

    public String toId(Object id) {
        return prefix + id.toString();
    }

    public Class<? extends FileElement<?>> getRelatedClass() {
        return relatedClass;
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

    public static Optional<Type> getByRelatedClass(Class<?> clazz) {
        for (Type value : values()) {
            if (value.relatedClass.equals(clazz)) {
                return Optional.of(value);
            }
        }
        return Optional.empty();
    }
}
