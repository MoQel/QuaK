package edu.kit.quak.application.user.exceptions;

import edu.kit.quak.core.common.exception.DomainRuleViolationException;

/** Thrown when an already authenticated user tries to become a guest. */
public class AlreadyAuthenticatedException extends DomainRuleViolationException {

    public AlreadyAuthenticatedException(String message) {
        super(message);
    }
}
