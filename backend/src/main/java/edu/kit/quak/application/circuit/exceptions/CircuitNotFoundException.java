package edu.kit.quak.application.circuit.exceptions;

import edu.kit.quak.application.common.exceptions.ResourceNotFoundException;

public class CircuitNotFoundException extends ResourceNotFoundException {

    public CircuitNotFoundException(String id) {
        super("Circuit", id);
    }
}
