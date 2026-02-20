package edu.kit.quak.core.circuit.exceptions;

import edu.kit.quak.core.common.exception.DomainRuleViolationException;

public class MismatchedOperationTypeException extends DomainRuleViolationException {

    public MismatchedOperationTypeException(Class<?> expected, Class<?> actual) {
        super("Operation type mismatch: expected %s but got %s".formatted(expected.getSimpleName(), actual.getSimpleName()));
    }
}
