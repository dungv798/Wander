package com.wander.shared.web.error;

import com.wander.shared.kernel.error.ErrorKind;
import org.springframework.http.HttpStatus;

/** The single place that maps a business error kind to an HTTP status. */
public final class HttpStatuses {

    private HttpStatuses() {
    }

    /** The HTTP status that corresponds to a business error kind. */
    public static HttpStatus of(ErrorKind kind) {
        return switch (kind) {
            case INVALID -> HttpStatus.BAD_REQUEST;
            case NOT_FOUND -> HttpStatus.NOT_FOUND;
            case CONFLICT -> HttpStatus.CONFLICT;
            case FORBIDDEN -> HttpStatus.FORBIDDEN;
            case UNAUTHENTICATED -> HttpStatus.UNAUTHORIZED;
            case RATE_LIMITED -> HttpStatus.TOO_MANY_REQUESTS;
            case PAYLOAD_TOO_LARGE -> HttpStatus.CONTENT_TOO_LARGE;
            case METHOD_NOT_ALLOWED -> HttpStatus.METHOD_NOT_ALLOWED;
        };
    }
}
