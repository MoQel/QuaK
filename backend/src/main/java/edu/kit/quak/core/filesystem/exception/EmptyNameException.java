package edu.kit.quak.core.filesystem.exception;

import edu.kit.quak.core.common.exception.DomainRuleViolationException;

public class EmptyNameException extends DomainRuleViolationException {

    public EmptyNameException() {
        super("Name cannot be empty");
    }
}
