package edu.kit.quak.application.filesystem.exceptions;

/**
 * Thrown when a user attempts to access a resource they do not own. This is a domain exception that
 * should be mapped to HTTP 403 Forbidden by the infrastructure layer.
 */
public class AccessDeniedException extends RuntimeException {

    public AccessDeniedException(String message) {
        super(message);
    }

    public AccessDeniedException(String resourceType, String resourceId) {
        super(
                "Access denied: You do not have permission to access "
                        + resourceType
                        + " with ID '"
                        + resourceId
                        + "'");
    }
}
