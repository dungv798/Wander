package com.wander.shared.kernel.error;

/**
 * The kind of error by business meaning. The web layer (shared.web) maps it to an HTTP status;
 * the domain and application layers know nothing about HTTP.
 */
public enum ErrorKind {
    INVALID,
    NOT_FOUND,
    CONFLICT,
    FORBIDDEN,
    UNAUTHENTICATED,
    RATE_LIMITED,
    PAYLOAD_TOO_LARGE,
    METHOD_NOT_ALLOWED
}
