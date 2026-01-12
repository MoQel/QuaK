package edu.kit.quak.core.circuit.model.register;

import edu.kit.quak.core.circuit.model.ElementWithId;

public abstract class Register extends ElementWithId {
    protected final String name;

    protected Register(String name) {
        super();
        this.name = name;
    }

    public String getName() {
        return name;
    }
}
