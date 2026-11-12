package com.wander.shared.kernel.constant;

/**
 * Stable error codes the UI relies on (the API contract, see docs/ux/error-codes.md): only the codes shared by the whole system.
 * Codes specific to a module are in that module's {@code *ErrorCodes} file.
 */
public final class ErrorCodes {

    /** The resource was not found (or it belongs to someone else). */
    public static final String NOT_FOUND = "NOT_FOUND";

    /** Two operations edited the same data at the same time (optimistic lock). */
    public static final String CONCURRENT_MODIFICATION = "CONCURRENT_MODIFICATION";

    /** The HTTP method is not supported for this path. */
    public static final String METHOD_NOT_ALLOWED = "METHOD_NOT_ALLOWED";

    /** An unexpected error on the server side. */
    public static final String INTERNAL = "INTERNAL";

    /** The request has no valid session. */
    public static final String UNAUTHENTICATED = "UNAUTHENTICATED";

    /** The rate limit was exceeded. */
    public static final String RATE_LIMITED = "RATE_LIMITED";

    /** The request body is not valid JSON or not a JSON object. */
    public static final String INVALID_JSON = "INVALID_JSON";

    /** The request body exceeds the size limit. */
    public static final String BODY_TOO_LARGE = "BODY_TOO_LARGE";

    /** A value of the wrong type or the wrong format (for example '1.5' for an integer, D17). */
    public static final String MALFORMED = "MALFORMED";

    /** A field is required but empty. */
    public static final String REQUIRED = "REQUIRED";

    /** A value outside the allowed range. */
    public static final String OUT_OF_RANGE = "OUT_OF_RANGE";

    /** A number greater than the maximum. */
    public static final String TOO_LARGE = "TOO_LARGE";

    /** A string or range longer than the maximum. */
    public static final String TOO_LONG = "TOO_LONG";

    /** A list with more elements than the maximum. */
    public static final String TOO_MANY = "TOO_MANY";

    /** A negative number where only a non-negative one is accepted. */
    public static final String NEGATIVE = "NEGATIVE";

    private ErrorCodes() {
    }
}
