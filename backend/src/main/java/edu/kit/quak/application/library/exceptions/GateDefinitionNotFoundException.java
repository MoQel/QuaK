package edu.kit.quak.application.library.exceptions;

public class GateDefinitionNotFoundException extends RuntimeException {

    public GateDefinitionNotFoundException(String name) {
        super("Gate with name '" + name + "' not found.");
    }
}
