package edu.kit.quak.core.lsp.exceptions;

import edu.kit.quak.core.common.exception.DomainRuleViolationException;

public class InvalidLspLanguageIdException extends DomainRuleViolationException {

    public InvalidLspLanguageIdException(String message) {
        super(message);
    }
}
