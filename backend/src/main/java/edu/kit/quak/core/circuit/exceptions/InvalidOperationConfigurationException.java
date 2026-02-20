package edu.kit.quak.core.circuit.exceptions;

import edu.kit.quak.core.common.exception.DomainRuleViolationException;

public class InvalidOperationConfigurationException extends DomainRuleViolationException {

    public InvalidOperationConfigurationException(String message) {
        super(message);
    }
}
