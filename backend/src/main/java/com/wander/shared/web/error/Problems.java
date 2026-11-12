package com.wander.shared.web.error;

import com.wander.shared.web.constant.HttpConstants;
import com.wander.shared.web.constant.ObservabilityConstants;
import java.net.URI;
import java.util.Locale;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;

/**
 * Builds the API's error bodies as RFC 9457 problem details ({@code application/problem+json}). Besides the standard members
 * ({@code type}, {@code title}, {@code status}, {@code detail}) every problem carries the stable machine-readable {@code code}
 * the web client switches on, the {@code requestId} of the request being handled (the same value as the {@code X-Request-Id} header
 * and the log lines of that request), and optionally the offending {@code field} and structured {@code details}.
 */
public final class Problems {

    private Problems() {
    }

    /**
     * A problem for the given status and application error code.
     *
     * @param status  HTTP status
     * @param code    stable error code (for example {@code INVALID_TYPE}); also forms the {@code type} URN
     * @param message user-facing explanation, sent as {@code detail}
     * @param field   name of the invalid input field, or {@code null}
     * @param details extra structured information, or {@code null}
     */
    public static ProblemDetail of(HttpStatus status, String code, String message, String field, Object details) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, message);
        problem.setType(URI.create(HttpConstants.PROBLEM_TYPE_PREFIX + code.toLowerCase(Locale.ROOT).replace(HttpConstants.UNDERSCORE, HttpConstants.HYPHEN)));
        problem.setTitle(status.getReasonPhrase());
        problem.setProperty(HttpConstants.PROBLEM_PROPERTY_CODE, code);
        String requestId = MDC.get(ObservabilityConstants.REQUEST_ID_KEY);
        if (requestId != null) {
            problem.setProperty(ObservabilityConstants.REQUEST_ID_KEY, requestId);
        }
        if (field != null) {
            problem.setProperty(HttpConstants.PROBLEM_PROPERTY_FIELD, field);
        }
        if (details != null) {
            problem.setProperty(HttpConstants.PROBLEM_PROPERTY_DETAILS, details);
        }
        return problem;
    }

    /** A problem with only a code and a message (no field, no details). */
    public static ProblemDetail simple(HttpStatus status, String code, String message) {
        return of(status, code, message, null, null);
    }
}
