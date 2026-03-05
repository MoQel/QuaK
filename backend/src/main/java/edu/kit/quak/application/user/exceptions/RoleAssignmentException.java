package edu.kit.quak.application.user.exceptions;

import edu.kit.quak.core.common.exception.DomainRuleViolationException;

/**
 * Exception thrown when a project role assignment violates domain rules.
 */
public class RoleAssignmentException extends DomainRuleViolationException {

    public RoleAssignmentException(String message) {
        super(message);
    }
}
