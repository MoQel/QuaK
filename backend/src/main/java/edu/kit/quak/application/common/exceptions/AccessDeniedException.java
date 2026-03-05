package edu.kit.quak.application.common.exceptions;

import lombok.Getter;

/**
 * Thrown when ownership or permission checks fail.
 * Mapped to HTTP 403 Forbidden.
 */
@Getter
public class AccessDeniedException extends RuntimeException {

    public AccessDeniedException(String resourceType, String resourceId) {
        super(String.format("Access denied: No permission for %s with ID '%s'", resourceType, resourceId));
    }

    public AccessDeniedException(String message) {
        super(message);
    }
}
