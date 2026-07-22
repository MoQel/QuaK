package edu.kit.quak.application.circuit.exceptions;

/**
 * Thrown when OpenQASM source code cannot be translated into a circuit, e.g. on syntax errors,
 * unsupported gates/operands, or non-constant qubit indices. Mapped to HTTP 400 Bad Request.
 */
public class QasmParseException extends RuntimeException {

    public QasmParseException(String message) {
        super(message);
    }

    public QasmParseException(String message, Throwable cause) {
        super(message, cause);
    }
}
