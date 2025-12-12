package edu.kit.quak.core.circuit.model;

import java.util.UUID;

public abstract class ElementWithId {
    private final String id;

    protected ElementWithId() {
        id  = UUID.randomUUID().toString();
    }

    public String getId() {
        return id;
    }
}
