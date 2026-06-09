package edu.kit.quak.core.lsp.model;

import edu.kit.quak.core.lsp.exceptions.InvalidLspLanguageIdException;

public record LspLanguageId(String value) {
    public LspLanguageId {
        if (value == null) {
            throw new InvalidLspLanguageIdException("Language ID must not be null");
        }
        if (value.isBlank()) {
            throw new InvalidLspLanguageIdException("Language ID must not be blank");
        }
    }
}
