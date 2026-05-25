package edu.kit.quak.core.lsp.model;

import edu.kit.quak.core.lsp.exceptions.UnsupportedLspLanguageException;

public enum LspLanguage {
    // extend for more lsp languages
    PYTHON("python"),
    QASM("qasm");

    private final String id;

    LspLanguage(String id) {
        this.id = id;
    }

    public String id() {
        return id;
    }

    public static LspLanguage fromId(String value) {
        for (LspLanguage language : values()) {
            if (language.id.equalsIgnoreCase(value)) {
                return language;
            }
        }
        throw new UnsupportedLspLanguageException(value);
    }
}
