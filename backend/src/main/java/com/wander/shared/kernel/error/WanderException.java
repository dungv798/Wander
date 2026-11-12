package com.wander.shared.kernel.error;

import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.constant.ErrorMessages;
/**
 * An error with a stable code that the UI relies on (for example NEGATIVE, DATES_ORPHAN_ITEMS).
 * The code and field stay as in the old API contract so the web does not have to change.
 */
public class WanderException extends RuntimeException {

    private final ErrorKind kind;
    private final String code;
    private final String field;
    private final transient Object details;

    /** Creates a full error: the kind, the code, the message, the wrong field (if any) and the accompanying details (if any). */
    public WanderException(ErrorKind kind, String code, String message, String field, Object details) {
        super(message);
        this.kind = kind;
        this.code = code;
        this.field = field;
        this.details = details;
    }

    /** An invalid-input error on one field. */
    public static WanderException invalid(String code, String message, String field) {
        return new WanderException(ErrorKind.INVALID, code, message, field, null);
    }

    /** An invalid-value error on one field, using the generic message. */
    public static WanderException invalidValue(String code, String field) {
        return invalid(code, ErrorMessages.VALUE_INVALID, field);
    }

    /** The resource was not found, using the generic message. */
    public static WanderException notFound() {
        return notFound(ErrorMessages.NOT_FOUND);
    }

    /** The resource was not found, with its own message. */
    public static WanderException notFound(String message) {
        return new WanderException(ErrorKind.NOT_FOUND, ErrorCodes.NOT_FOUND, message, null, null);
    }

    /** A state conflict, with no details. */
    public static WanderException conflict(String code, String message) {
        return new WanderException(ErrorKind.CONFLICT, code, message, null, null);
    }

    /** A state conflict, with details for the client (for example the list of blocking items). */
    public static WanderException conflict(String code, String message, Object details) {
        return new WanderException(ErrorKind.CONFLICT, code, message, null, details);
    }

    /** Not enough permission to perform the action. */
    public static WanderException forbidden(String code, String message) {
        return new WanderException(ErrorKind.FORBIDDEN, code, message, null, null);
    }

    /** The kind of error; the web layer turns it into an HTTP status. */
    public ErrorKind kind() {
        return kind;
    }

    /** The stable error code for the UI. */
    public String code() {
        return code;
    }

    /** The name of the wrong field, or null if the error is not tied to a field. */
    public String field() {
        return field;
    }

    /** The accompanying details, or null. */
    public Object details() {
        return details;
    }
}
