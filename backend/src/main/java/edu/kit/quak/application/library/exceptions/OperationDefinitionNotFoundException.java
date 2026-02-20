package edu.kit.quak.application.library.exceptions;

import edu.kit.quak.application.common.exceptions.ResourceNotFoundException;

public class OperationDefinitionNotFoundException extends ResourceNotFoundException {

    public OperationDefinitionNotFoundException(String id) {
        super("Operation Definition", id);
    }
}
