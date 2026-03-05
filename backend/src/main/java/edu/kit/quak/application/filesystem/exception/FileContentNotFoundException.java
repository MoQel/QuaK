package edu.kit.quak.application.filesystem.exception;

import edu.kit.quak.application.common.exceptions.ResourceNotFoundException;

public class FileContentNotFoundException extends ResourceNotFoundException {

    public FileContentNotFoundException(String id) {
        super("File Content", id);
    }
}
