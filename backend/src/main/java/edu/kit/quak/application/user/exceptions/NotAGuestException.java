package edu.kit.quak.application.user.exceptions;

import edu.kit.quak.core.common.exception.DomainRuleViolationException;

/** Thrown when an operation that only guests may perform is requested by someone else. */
public class NotAGuestException extends DomainRuleViolationException {

    public NotAGuestException(String message) {
        super(message);
    }
}
