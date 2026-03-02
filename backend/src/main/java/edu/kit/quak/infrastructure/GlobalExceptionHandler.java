package edu.kit.quak.infrastructure;

import edu.kit.quak.application.common.exceptions.AccessDeniedException;
import edu.kit.quak.application.common.exceptions.ResourceNotFoundException;
import edu.kit.quak.application.user.exceptions.UserNotFoundException;
import edu.kit.quak.core.common.exception.DomainRuleViolationException;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Global exception handler that translates domain exceptions to HTTP responses. Follows RFC-7807
 * Problem Details for HTTP APIs.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    public static final String INTERNAL_SERVER_ERROR = "Internal Server Error";

    /**
     * Handles validation failures from @Valid annotations.
     * Mapped to 400 Bad Request.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidationErrors(MethodArgumentNotValidException ex) {
        String errors = ex
            .getBindingResult()
            .getFieldErrors()
            .stream()
            .map(error -> error.getField() + ": " + error.getDefaultMessage())
            .collect(Collectors.joining(", "));

        log.warn("Validation failed: {}", errors);

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Validation failed");
        problem.setTitle("Invalid Request Content");
        problem.setProperty("errors", errors);
        return problem;
    }

    /**
     * Handles business rule violations from the domain core.
     * Mapped to 400 Bad Request.
     */
    @ExceptionHandler(DomainRuleViolationException.class)
    public ProblemDetail handleDomainViolation(DomainRuleViolationException ex) {
        log.warn("Domain rule violated: {}", ex.getMessage());

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setTitle("Business Rule Violation");
        return problem;
    }

    /**
     * Handles authentication failures.
     * Mapped to 401 Unauthorized.
     */
    @ExceptionHandler(UserNotFoundException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ProblemDetail handleUserNotFound(UserNotFoundException ex) {
        log.warn("User Authentication Error: {}", ex.getMessage());

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, ex.getMessage());
        problem.setTitle("Unauthorized");
        return problem;
    }

    /**
     * Handles authorization and ownership check failures.
     * Mapped to 403 Forbidden.
     */
    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ProblemDetail handleAccessDenied(AccessDeniedException ex) {
        log.warn("Forbidden Access: {}", ex.getMessage());

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setTitle("Access Denied");
        return problem;
    }

    /**
     * Handles cases where a resource is missing.
     * Mapped to 404 Not Found.
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ProblemDetail handleNotFound(ResourceNotFoundException ex) {
        // Log as WARN without stack trace to avoid log pollution
        log.warn("Resource not found: type={}, id={}", ex.getResourceType(), ex.getResourceId());

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Resource Not Found");
        problem.setProperty("resourceType", ex.getResourceType());
        problem.setProperty("resourceId", ex.getResourceId());
        return problem;
    }

    /**
     * Handles illegal system states. Shields internal details from the client.
     * Mapped to 500 Internal Error.
     */
    @ExceptionHandler(IllegalStateException.class)
    public ProblemDetail handleIllegalState(IllegalStateException ex) {
        log.error(ex.getMessage(), ex);
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, INTERNAL_SERVER_ERROR);
        problem.setTitle(INTERNAL_SERVER_ERROR);
        return problem;
    }

    /**
     * Final fallback for unexpected exceptions. Provides full stack trace in logs.
     * Mapped to 500 Internal Error.
     */
    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGeneralError(Exception ex) {
        log.error("An unexpected error occurred", ex);

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred.");
        problem.setTitle(INTERNAL_SERVER_ERROR);
        return problem;
    }
}
