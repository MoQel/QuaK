package edu.kit.quak.application.user.exceptions;

import edu.kit.quak.core.common.exception.DomainRuleViolationException;

/**
 * Exception thrown when a user attempts to log in with an email already
 * associated with a different provider.
 */
public class DuplicateEmailException extends DomainRuleViolationException {

    public DuplicateEmailException(String message) {
        super(message);
    }
}
