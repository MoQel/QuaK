package edu.kit.quak.core.filesystem.exception;

import edu.kit.quak.core.common.exception.DomainRuleViolationException;

public class DuplicateNameException extends DomainRuleViolationException {

    public DuplicateNameException(String childName, String parentName) {
        super("An element with the name '" + childName + "' already exists in '" + parentName + "'");
    }

    public DuplicateNameException(String projectName) {
        super("A project with the name '" + projectName + "' already exists.'");
    }
}
