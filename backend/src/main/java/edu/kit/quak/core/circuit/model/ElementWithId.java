package edu.kit.quak.core.circuit.model;

import java.util.UUID;

public abstract class ElementWithId {

    protected String id;

    protected ElementWithId() {
        generateNewId();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public void generateNewId() {
        id = UUID.randomUUID().toString();
    }
}
