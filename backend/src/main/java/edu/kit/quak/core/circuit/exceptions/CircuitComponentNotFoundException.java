package edu.kit.quak.core.circuit.exceptions;

import lombok.Getter;

@Getter
public abstract class CircuitComponentNotFoundException extends RuntimeException {

    private final String componentType;
    private final String componentId;

    protected CircuitComponentNotFoundException(String componentType, String componentId) {
        super(String.format("%s with ID '%s' not found", componentType, componentId));
        this.componentType = componentType;
        this.componentId = componentId;
    }
}
