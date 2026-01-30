package edu.kit.quak.core.circuit.model;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public abstract class ElementWithId {
    protected String id;

    protected ElementWithId() {
        generateNewId();
    }

    public void generateNewId() {
        id = UUID.randomUUID().toString();
    }
}
