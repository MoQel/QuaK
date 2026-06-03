package edu.kit.quak.application.lsp.exceptions;

public class LspCommunicationException extends RuntimeException {

    public LspCommunicationException(String message, Throwable cause) {
        super(message, cause);
    }

    public LspCommunicationException(String message) {
        super(message);
    }
}
