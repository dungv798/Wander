package com.wander.shared.web.error;

import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.constant.ErrorMessages;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.web.constant.HttpConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/** Turns every error into an RFC 9457 problem body; unexpected errors never leak details. */
@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    /** A business error with a code: turns the error kind into an HTTP status, keeping the code, field and details for the UI. */
    @ExceptionHandler(WanderException.class)
    public ResponseEntity<ProblemDetail> handleBusinessError(WanderException e) {
        return ResponseEntity.status(HttpStatuses.of(e.kind()))
                .cacheControl(CacheControl.noStore())
                .contentType(HttpConstants.PROBLEM_JSON_UTF8)
                .body(Problems.of(HttpStatuses.of(e.kind()), e.code(), e.getMessage(), e.field(), e.details()));
    }

    /** A request body that cannot be read (bad JSON, wrong type for a field, oversized): reported as the matching input error. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ProblemDetail> handleUnreadableBody(HttpMessageNotReadableException e) {
        return handleBusinessError(RequestErrors.from(e));
    }

    /** A request record that violates its Bean Validation constraints: reported as the matching input error. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleInvalidBody(MethodArgumentNotValidException e) {
        return handleBusinessError(RequestErrors.fromValidation(e.getBindingResult()));
    }

    /** Two operations edited the same data at the same time: answers 409 so the user reloads. */
    @ExceptionHandler(OptimisticLockingFailureException.class)
    public ResponseEntity<ProblemDetail> handleConcurrentModification(OptimisticLockingFailureException e) {
        return errorResponse(HttpStatus.CONFLICT, ErrorCodes.CONCURRENT_MODIFICATION, ErrorMessages.CONCURRENT_MODIFICATION);
    }

    /**
     * Two requests wrote the same unique key (for example a duplicate trip name, a retry after a cold start): answers 409 instead of 500; does not expose the constraint name.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ProblemDetail> handleIntegrityViolation(DataIntegrityViolationException e) {
        log.warn(ErrorMessages.INTEGRITY_VIOLATION_LOG, e.getMostSpecificCause().getClass().getSimpleName());
        return errorResponse(HttpStatus.CONFLICT, ErrorCodes.CONCURRENT_MODIFICATION, ErrorMessages.CONCURRENT_MODIFICATION);
    }

    /** A path with no resource: answers 404 with the standard error body. */
    @ExceptionHandler({NoResourceFoundException.class, NoHandlerFoundException.class})
    public ResponseEntity<ProblemDetail> handleNotFound(Exception e) {
        return errorResponse(HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND, ErrorMessages.NOT_FOUND);
    }

    /** The HTTP method is not supported: answers 405. */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ProblemDetail> handleMethodNotAllowed(HttpRequestMethodNotSupportedException e) {
        return errorResponse(HttpStatus.METHOD_NOT_ALLOWED, ErrorCodes.METHOD_NOT_ALLOWED, ErrorMessages.METHOD_NOT_ALLOWED);
    }

    /** An unexpected error: logs it in full, answers only a generic message (500) so no details are exposed. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleUnexpectedError(Exception e) {
        log.error(ErrorMessages.UNEXPECTED_ERROR_LOG, e);
        return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL, ErrorMessages.INTERNAL);
    }

    /** Builds the standard error response from the HTTP status, the error code and the message. */
    private static ResponseEntity<ProblemDetail> errorResponse(HttpStatus status, String code, String message) {
        return ResponseEntity.status(status).cacheControl(CacheControl.noStore()).contentType(HttpConstants.PROBLEM_JSON_UTF8).body(Problems.simple(status, code, message));
    }
}
