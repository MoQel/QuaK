package edu.kit.quak.core.circuit.exceptions;

import edu.kit.quak.core.common.exception.DomainRuleViolationException;

public class UnknownQuantumOperationException extends DomainRuleViolationException {

    public UnknownQuantumOperationException(String value) {
        super("Unknown quantum operation: '%s'. Please refer to the supported operation library.".formatted(value));
    }
}
