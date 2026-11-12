package com.wander.shared.web.filter;

import com.wander.shared.kernel.constant.SystemConstants;
import com.wander.shared.web.constant.HttpConstants;
import com.wander.shared.web.request.RequestBodyLimit;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.web.filter.OncePerRequestFilter;

/** Caps the body of every {@code /api} request at {@link SystemConstants#MAX_REQUEST_BODY_BYTES}; larger bodies fail with 413. */
public class RequestBodyLimitFilter extends OncePerRequestFilter {

    /** Only API requests carry JSON bodies. */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith(HttpConstants.API_PATH_PREFIX);
    }

    /** Wraps the request so reading its body is size-limited. */
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        chain.doFilter(new RequestBodyLimit(request, SystemConstants.MAX_REQUEST_BODY_BYTES), response);
    }
}
