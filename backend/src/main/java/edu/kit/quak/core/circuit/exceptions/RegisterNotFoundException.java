package edu.kit.quak.core.circuit.exceptions;

import edu.kit.quak.core.common.exception.DomainRuleViolationException;

public class RegisterNotFoundException extends DomainRuleViolationException {

    public RegisterNotFoundException(String registerId) {
        super("Could not find quantum register with registerId %s".formatted(registerId));
    }
}
