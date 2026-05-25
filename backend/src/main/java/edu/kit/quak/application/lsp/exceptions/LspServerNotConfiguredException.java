package edu.kit.quak.application.lsp.exceptions;

import edu.kit.quak.application.common.exceptions.ResourceNotFoundException;

public class LspServerNotConfiguredException extends ResourceNotFoundException {

    public LspServerNotConfiguredException(String languageId) {
        super("Server configuration", languageId);
    }
}
