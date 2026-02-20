package edu.kit.quak.core.circuit.exceptions;

import edu.kit.quak.core.common.exception.DomainRuleViolationException;

public class OutOfBoundsException extends DomainRuleViolationException {

    public OutOfBoundsException(String type, int index, int max) {
        super("%s index %d is out of bounds. Valid range is between 0 and %d.".formatted(type, index, max - 1));
    }
}
