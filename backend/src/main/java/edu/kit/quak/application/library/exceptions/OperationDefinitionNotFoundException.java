package edu.kit.quak.application.library.exceptions;

public class OperationDefinitionNotFoundException extends RuntimeException {

    public OperationDefinitionNotFoundException(String name) {
        super("Operation Definition with name '" + name + "' not found.");
    }
}
