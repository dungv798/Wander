package com.wander.shared.web.filter;

import com.wander.shared.web.constant.HttpConstants;
import java.net.URI;

/**
 * Builds the {@code Content-Security-Policy} value. The strict base policy ({@link HttpConstants#VALUE_CONTENT_SECURITY_POLICY})
 * allows images from this origin and Unsplash only; when the catalog photos are served from another origin
 * ({@code WANDER_PHOTO_BASE_URL}), exactly that origin is added to {@code img-src} and nothing else changes.
 */
public final class ContentSecurityPolicy {

    private ContentSecurityPolicy() {
    }

    /**
     * Policy for the given photo base URL. A blank value returns the base policy unchanged; a value that is not an https URL with a
     * host is ignored (the application refuses to start with such a value anyway, see {@code PhotoUrls}), never copied into a header.
     */
    public static String forPhotoBaseUrl(String photoBaseUrl) {
        String origin = originOf(photoBaseUrl);
        if (origin == null) {
            return HttpConstants.VALUE_CONTENT_SECURITY_POLICY;
        }
        return HttpConstants.VALUE_CONTENT_SECURITY_POLICY.replace(HttpConstants.CSP_IMG_SRC_DEFAULT,
                HttpConstants.CSP_IMG_SRC_DEFAULT + HttpConstants.CSP_SOURCE_SEPARATOR + origin);
    }

    /** {@code scheme://host[:port]} of an https URL, or {@code null} when the value is blank or not a plain https URL. */
    private static String originOf(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }
        try {
            URI uri = URI.create(url.trim());
            boolean plainHttps = HttpConstants.SCHEME_HTTPS.equals(uri.getScheme()) && uri.getHost() != null && uri.getUserInfo() == null
                    && uri.getQuery() == null && uri.getFragment() == null;
            if (!plainHttps) {
                return null;
            }
            String origin = HttpConstants.SCHEME_HTTPS + HttpConstants.SCHEME_SEPARATOR + uri.getHost();
            return uri.getPort() < 0 ? origin : origin + HttpConstants.PORT_SEPARATOR + uri.getPort();
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
