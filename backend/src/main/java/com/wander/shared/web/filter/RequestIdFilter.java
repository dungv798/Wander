package com.wander.shared.web.filter;

import com.wander.shared.web.constant.HttpConstants;
import com.wander.shared.web.constant.ObservabilityConstants;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.slf4j.event.Level;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerMapping;

/**
 * Gives every request an id, so one request can be followed across the response, the error body and the log lines it produced.
 * A caller-supplied {@code X-Request-Id} is kept when it is short and harmless, otherwise a random one is generated. The id is put in the
 * logging context (MDC), returned in the response header, and, for errors, in the {@code requestId} member of the problem. When the
 * request has been handled, one line is logged with the method, the <em>route template</em> (never the raw path, which can contain
 * identifiers), the status and the duration. Query strings, headers and bodies are never logged.
 */
public class RequestIdFilter extends OncePerRequestFilter {

    private static final Logger LOG = LoggerFactory.getLogger(RequestIdFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String requestId = resolveRequestId(request.getHeader(ObservabilityConstants.HEADER_REQUEST_ID));
        MDC.put(ObservabilityConstants.REQUEST_ID_KEY, requestId);
        response.setHeader(ObservabilityConstants.HEADER_REQUEST_ID, requestId);
        long startedAt = System.nanoTime();
        try {
            chain.doFilter(request, response);
        } finally {
            logCompletion(request, response, startedAt);
            MDC.remove(ObservabilityConstants.REQUEST_ID_KEY);
        }
    }

    /** The caller's id when it is acceptable, otherwise a new random one. */
    private static String resolveRequestId(String supplied) {
        if (supplied != null && ObservabilityConstants.ACCEPTED_REQUEST_ID.matcher(supplied).matches()) {
            return supplied;
        }
        return UUID.randomUUID().toString();
    }

    /** Logs the completion line: INFO for API calls, DEBUG for everything else (static files, health probes). */
    private static void logCompletion(HttpServletRequest request, HttpServletResponse response, long startedAt) {
        Level level = request.getRequestURI().startsWith(HttpConstants.API_PATH_PREFIX) ? Level.INFO : Level.DEBUG;
        Object pattern = request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
        LOG.atLevel(level)
                .addKeyValue(ObservabilityConstants.KEY_METHOD, request.getMethod())
                .addKeyValue(ObservabilityConstants.KEY_ROUTE, pattern == null ? ObservabilityConstants.UNMATCHED_ROUTE : pattern.toString())
                .addKeyValue(ObservabilityConstants.KEY_STATUS, response.getStatus())
                .addKeyValue(ObservabilityConstants.KEY_DURATION_MS, (System.nanoTime() - startedAt) / ObservabilityConstants.NANOS_PER_MILLI)
                .log(ObservabilityConstants.REQUEST_COMPLETED_MESSAGE);
    }
}
