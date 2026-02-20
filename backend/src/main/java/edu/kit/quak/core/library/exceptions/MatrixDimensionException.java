package edu.kit.quak.core.library.exceptions;

import edu.kit.quak.core.common.exception.DomainRuleViolationException;

public class MatrixDimensionException extends DomainRuleViolationException {

    public MatrixDimensionException(String message) {
        super(message);
    }
}
