package edu.kit.quak.application.filesystem.exception;

import edu.kit.quak.application.common.exceptions.ResourceNotFoundException;

public class ProjectNotFoundException extends ResourceNotFoundException {

    public ProjectNotFoundException(String id) {
        super("Project", id);
    }
}
