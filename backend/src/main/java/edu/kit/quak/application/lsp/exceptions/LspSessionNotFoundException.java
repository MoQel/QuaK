package edu.kit.quak.application.lsp.exceptions;

import edu.kit.quak.application.common.exceptions.ResourceNotFoundException;

public class LspSessionNotFoundException extends ResourceNotFoundException {

    public LspSessionNotFoundException(String sessionId) {
        super("LSP session", sessionId);
    }
}
