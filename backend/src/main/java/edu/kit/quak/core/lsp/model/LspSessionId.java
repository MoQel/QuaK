package edu.kit.quak.core.lsp.model;

import java.util.UUID;

public record LspSessionId(String value) {
    public static LspSessionId newId() {
        return new LspSessionId(UUID.randomUUID().toString());
    }
}
