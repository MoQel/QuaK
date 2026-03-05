package edu.kit.quak.core.circuit.exceptions;

import edu.kit.quak.core.common.exception.DomainRuleViolationException;

public class InvalidRegisterTypeException extends DomainRuleViolationException {

    public InvalidRegisterTypeException(String registerId) {
        super("Register with registerId %s is not a QuantumRegister.".formatted(registerId));
    }
}
