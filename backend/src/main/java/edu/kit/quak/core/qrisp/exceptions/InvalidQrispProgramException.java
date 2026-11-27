package edu.kit.quak.core.qrisp.exceptions;

import edu.kit.quak.core.common.exception.DomainRuleViolationException;

public class InvalidQrispProgramException extends DomainRuleViolationException {

    public InvalidQrispProgramException(String message) {
        super(message);
    }
}
