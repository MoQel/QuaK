package edu.kit.quak.infrastructure.lsp.exceptions;

public class LspInfrastructureException extends RuntimeException {

    public LspInfrastructureException(String message, Throwable cause) {
        super(message, cause);
    }

    public LspInfrastructureException(String message) {
        super(message);
    }
}
