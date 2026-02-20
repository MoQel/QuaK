package edu.kit.quak.core.circuit.exceptions;

import edu.kit.quak.core.common.exception.DomainRuleViolationException;

public class EmptyTargetQubitsException extends DomainRuleViolationException {

    public EmptyTargetQubitsException() {
        super("Must provide at least one qubit to target.");
    }
}
