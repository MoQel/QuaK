package edu.kit.quak.application.user.exceptions;

/**
 * Thrown when a user cannot be found in the database.
 * This is a domain exception that should be mapped to HTTP 401 Unauthorized
 * by the infrastructure layer.
 */
public class UserNotFoundException extends RuntimeException {

    public UserNotFoundException(String issuer, String subject) {
        super("User not found for issuer '" + issuer + "' and subject '" + subject + "'");
    }

    public UserNotFoundException(String message) {
        super(message);
    }
}
