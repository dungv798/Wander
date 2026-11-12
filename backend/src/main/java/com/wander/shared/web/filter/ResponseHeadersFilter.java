package com.wander.shared.web.filter;

import com.wander.shared.web.constant.HttpConstants;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Security and cache headers. API: no caching. UI: a strict CSP (no external scripts), anti-framing;
 * files with a hash in /assets/ are cached for a long time, index.html is not.
 */
public class ResponseHeadersFilter extends OncePerRequestFilter {

    private final String contentSecurityPolicy;

    /** @param contentSecurityPolicy value of the CSP header sent with UI responses (see {@link ContentSecurityPolicy}) */
    public ResponseHeadersFilter(String contentSecurityPolicy) {
        this.contentSecurityPolicy = contentSecurityPolicy;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        response.setHeader(HttpConstants.HEADER_X_CONTENT_TYPE_OPTIONS, HttpConstants.VALUE_NOSNIFF);
        // HSTS: the browser applies it only when received over HTTPS (ignored on http://localhost). TLS ends at CloudFront so
        // the application sets this header on every response; no includeSubDomains/preload so it does not bind other domains.
        response.setHeader(HttpConstants.HEADER_STRICT_TRANSPORT_SECURITY, HttpConstants.VALUE_HSTS);
        if (path.startsWith(HttpConstants.API_PATH_PREFIX)) {
            response.setHeader(HttpConstants.HEADER_CACHE_CONTROL, HttpConstants.VALUE_CACHE_NO_STORE);
        } else if (!path.startsWith(HttpConstants.ACTUATOR_PATH_PREFIX)) {
            applyUiHeaders(response, path);
        }
        chain.doFilter(request, response);
        if (response.getStatus() >= HttpConstants.CLIENT_ERROR_STATUS_MIN) {
            response.setHeader(HttpConstants.HEADER_CACHE_CONTROL, HttpConstants.VALUE_CACHE_NO_STORE);
        }
    }

    /** Whether the path belongs to the API documentation (Swagger UI or the OpenAPI document). */
    private static boolean isDocsPath(String path) {
        for (String prefix : HttpConstants.DOCS_PATH_PREFIXES) {
            if (path.startsWith(prefix)) {
                return true;
            }
        }
        return false;
    }

    /** Headers for the UI: anti-framing, a strict CSP, long caching for hashed files, everything else must revalidate. */
    private void applyUiHeaders(HttpServletResponse response, String path) {
        response.setHeader(HttpConstants.HEADER_X_FRAME_OPTIONS, HttpConstants.VALUE_DENY);
        response.setHeader(HttpConstants.HEADER_REFERRER_POLICY, HttpConstants.VALUE_NO_REFERRER);
        response.setHeader(HttpConstants.HEADER_CONTENT_SECURITY_POLICY, isDocsPath(path) ? HttpConstants.VALUE_CONTENT_SECURITY_POLICY_DOCS : contentSecurityPolicy);
        boolean isHashedAsset = path.startsWith(HttpConstants.ASSETS_PATH_PREFIX);
        response.setHeader(HttpConstants.HEADER_CACHE_CONTROL,
                isHashedAsset ? HttpConstants.VALUE_CACHE_IMMUTABLE_ASSET : HttpConstants.VALUE_CACHE_NO_CACHE);
    }
}
