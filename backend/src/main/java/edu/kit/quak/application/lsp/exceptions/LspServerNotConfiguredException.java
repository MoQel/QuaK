package edu.kit.quak.application.lsp.exceptions;

public class LspServerNotConfiguredException extends LspCommunicationException {

    public LspServerNotConfiguredException(String languageId) {
        super("No LSP server configured for language: " + languageId);
    }
}
