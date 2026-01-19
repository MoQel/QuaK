package edu.kit.quak.application.library.exceptions;

public class GateNotFoundException extends RuntimeException {
    public GateNotFoundException(String name) {
        super("Gate with name '" + name + "' not found.");
    }
}
