package edu.kit.quak.infrastructure;

import edu.kit.quak.application.filesystem.exceptions.AccessDeniedException;
import edu.kit.quak.application.library.exceptions.GateDefinitionNotFoundException;
import edu.kit.quak.application.user.exceptions.UserNotFoundException;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;
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
@RestControllerAdvice
public class GlobalExceptionHandler {

    // Catches Validation errors -> 400 Bad Request
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidationErrors(MethodArgumentNotValidException ex) {
        String errors = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Validation failed");
        problem.setTitle("Invalid Request Content");
        problem.setProperty("errors", errors); // Custom Property hinzufügen
        return problem;
    }

    // Catches “Not Found” errors from the services -> 400
    // Currently, we often use IllegalArgumentException for “Not found.”
    // Strictly speaking, IllegalArgumentException is a 400 (client error).
    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail handleIllegalArgument(IllegalArgumentException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setTitle("Bad Request");
        return problem;
    }

    // Catches "Corrupt State" and Configuration errors -> 500 Internal Server Error
    @ExceptionHandler(IllegalStateException.class)
    public ProblemDetail handleIllegalState(IllegalStateException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, ex.getMessage());
        problem.setTitle("Internal Server Error");
        return problem;
    }

    // Catches standard Optional.orElseThrow() -> 404 Not Found
    @ExceptionHandler(NoSuchElementException.class)
    public ProblemDetail handleNotFound(NoSuchElementException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Resource Not Found");
        return problem;
    }

    // Catches user authentication failures -> 401 Unauthorized
    @ExceptionHandler(UserNotFoundException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ProblemDetail handleUserNotFound(UserNotFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, ex.getMessage());
        problem.setTitle("Unauthorized");
        return problem;
    }

    // Catches authorization/ownership failures -> 403 Forbidden
    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ProblemDetail handleAccessDenied(AccessDeniedException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setTitle("Access Denied");
        return problem;
    }

    // TODO: Seperate library related and filesystem related exceptions
    @ExceptionHandler(GateDefinitionNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND) // 404
    public ProblemDetail handleGateNotFound(GateDefinitionNotFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Gate Not Found");
        return problem;
    }

    // Fallback -> 500 Internal Server Error
    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGeneralError(Exception ex) {
        ex.printStackTrace(); // Simple fallback logging
        ProblemDetail problem =
                ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred.");
        problem.setTitle("Internal Error");
        return problem;
    }
}
