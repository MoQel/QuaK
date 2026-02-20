package edu.kit.quak.core.circuit.exceptions;

import edu.kit.quak.core.common.exception.DomainRuleViolationException;

public class EmptyClassicBitAssignmentException extends DomainRuleViolationException {

    public EmptyClassicBitAssignmentException() {
        super("A measurement operation must assign its result to at least one classic bit.");
    }
}
