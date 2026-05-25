package edu.kit.quak.core.lsp.exceptions;

import edu.kit.quak.core.common.exception.DomainRuleViolationException;

public class UnsupportedLspLanguageException extends DomainRuleViolationException {

    public UnsupportedLspLanguageException(String value) {
        super("Unsupported language: " + value);
    }
}
