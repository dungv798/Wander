package com.wander.shared.web.constant;

import java.util.regex.Pattern;

/** Names and limits used for request correlation, request logging and metrics. */
public final class ObservabilityConstants {

    /** Header that carries the request id, in the request (optional) and in every response. */
    public static final String HEADER_REQUEST_ID = "X-Request-Id";

    /** Key of the request id in the logging context (MDC) and name of the {@code requestId} member of a problem. */
    public static final String REQUEST_ID_KEY = "requestId";

    /** A request id supplied by the caller is used only if it matches this: short and made of harmless characters. */
    public static final Pattern ACCEPTED_REQUEST_ID = Pattern.compile("[A-Za-z0-9._-]{1,64}");

    /** Message of the line logged when a request has been handled. */
    public static final String REQUEST_COMPLETED_MESSAGE = "http request completed";

    /** Key-value name: HTTP method of the request. */
    public static final String KEY_METHOD = "method";

    /** Key-value name: route template (never the raw path, which may contain identifiers). */
    public static final String KEY_ROUTE = "route";

    /** Key-value name: HTTP status of the response. */
    public static final String KEY_STATUS = "status";

    /** Key-value name: time taken to handle the request, in milliseconds. */
    public static final String KEY_DURATION_MS = "durationMs";

    /** Route reported when no controller matched the request (static files, 404 for unknown paths). */
    public static final String UNMATCHED_ROUTE = "unmatched";

    /** Nanoseconds in a millisecond. */
    public static final long NANOS_PER_MILLI = 1_000_000L;

    private ObservabilityConstants() {
    }
}
