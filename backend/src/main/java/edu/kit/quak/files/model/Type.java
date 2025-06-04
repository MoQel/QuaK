package edu.kit.quak.files.model;

public enum Type {
    DIRECTORY("directory", 'd'), FILE("file", 'f'), PROJECT("project", 'p');

    public final String value;
    private final char prefix;

    Type(String value, char prefix) {
        this.value = value;
        this.prefix = prefix;
    }

    public String toId(Object id) {
        return prefix + id.toString();
    }

    @Override
    public String toString() {
        return value;
    }
}
