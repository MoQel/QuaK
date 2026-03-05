package edu.kit.quak.application.filesystem.exception;

import edu.kit.quak.application.common.exceptions.ResourceNotFoundException;

public class FileNotFoundException extends ResourceNotFoundException {

    public FileNotFoundException(String id) {
        super("File", id);
    }
}
