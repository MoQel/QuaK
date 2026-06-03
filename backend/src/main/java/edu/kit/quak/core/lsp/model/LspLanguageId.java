package edu.kit.quak.core.lsp.model;

import java.util.Objects;

public record LspLanguageId(String value) {
    public LspLanguageId {
        Objects.requireNonNull(value, "Language ID must not be null");
    }
}
