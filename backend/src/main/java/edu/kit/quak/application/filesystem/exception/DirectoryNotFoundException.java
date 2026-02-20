package edu.kit.quak.application.filesystem.exception;

import edu.kit.quak.application.common.exceptions.ResourceNotFoundException;

public class DirectoryNotFoundException extends ResourceNotFoundException {

    public DirectoryNotFoundException(String id) {
        super("Directory", id);
    }
}
