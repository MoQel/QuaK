package edu.kit.quak.core.circuit.model;

import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

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
