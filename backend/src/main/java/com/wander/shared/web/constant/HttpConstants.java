package com.wander.shared.web.constant;

import java.nio.charset.StandardCharsets;
import org.springframework.http.MediaType;

/**
 * Shared HTTP constants (SYSTEM tier, web layer): header names, security and cache header values, path prefixes.
 */
public final class HttpConstants {

    /** The first code of the client-error group; no error is cached as an immutable asset. */
    public static final int CLIENT_ERROR_STATUS_MIN = 400;

    /** Path pattern for the API interceptor. */
    public static final String ALL_API_PATHS = "/api/**";

    /**
     * Paths not counted into the per-identity write budget because there is already a separate 'approval' counter per session (20/hour):
     * device pairing, recovery code, re-authentication. This way someone holding a session cannot exhaust the owner's approve/deny ability.
     */
    public static final String[] WRITE_BUDGET_EXEMPT_PATHS = {"/api/device-links/**", "/api/recovery-code/**", "/api/step-up/**"};

    /** Path prefix of the sessions (revoking a session is a DELETE under this prefix). */
    public static final String SESSIONS_PATH_PREFIX = "/api/sessions/";

    /** Path prefix of the API (with the leading slash). */
    public static final String API_PATH_PREFIX = "/api/";

    /** Path prefix of the actuator (with the leading slash). */
    public static final String ACTUATOR_PATH_PREFIX = "/actuator/";

    /** Path prefix of the hashed UI files (with the leading slash). */
    public static final String ASSETS_PATH_PREFIX = "/assets/";

    /** The API resource prefix without the leading slash (used in the resource resolver). */
    public static final String API_RESOURCE_PREFIX = "api/";

    /** The actuator resource prefix without the leading slash. */
    public static final String ACTUATOR_RESOURCE_PREFIX = "actuator/";

    /** The header with the chain of addresses through the proxies. */
    public static final String HEADER_X_FORWARDED_FOR = "X-Forwarded-For";

    /** The header that stops the browser from guessing the content type. */
    public static final String HEADER_X_CONTENT_TYPE_OPTIONS = "X-Content-Type-Options";

    /** The value of {@link #HEADER_X_CONTENT_TYPE_OPTIONS}. */
    public static final String VALUE_NOSNIFF = "nosniff";

    /** Header HSTS. */
    public static final String HEADER_STRICT_TRANSPORT_SECURITY = "Strict-Transport-Security";

    /** HSTS lifetime: 365 days in seconds. */
    public static final long HSTS_MAX_AGE_SECONDS = 31_536_000L;

    /** The HSTS header value (no includeSubDomains/preload so it does not bind other domains). */
    public static final String VALUE_HSTS = "max-age=" + HSTS_MAX_AGE_SECONDS;

    /** The cache-control header. */
    public static final String HEADER_CACHE_CONTROL = "Cache-Control";

    /** The API must not be cached. */
    public static final String VALUE_CACHE_NO_STORE = "no-store";

    /** The UI normally has to revalidate with the server. */
    public static final String VALUE_CACHE_NO_CACHE = "no-cache";

    /** A file with a hash in its name is cached for one year, unchanged. */
    public static final String VALUE_CACHE_IMMUTABLE_ASSET = "public, max-age=" + HSTS_MAX_AGE_SECONDS + ", immutable";

    /** The header against framing. */
    public static final String HEADER_X_FRAME_OPTIONS = "X-Frame-Options";

    /** The value of {@link #HEADER_X_FRAME_OPTIONS}. */
    public static final String VALUE_DENY = "DENY";

    /** The referrer-policy header. */
    public static final String HEADER_REFERRER_POLICY = "Referrer-Policy";

    /** Do not send a referrer. */
    public static final String VALUE_NO_REFERRER = "no-referrer";

    /** The content-security-policy header. */
    public static final String HEADER_CONTENT_SECURITY_POLICY = "Content-Security-Policy";

    /** Default {@code img-src} directive: this origin, inline data/blob images and Unsplash. */
    public static final String CSP_IMG_SRC_DEFAULT = "img-src 'self' data: blob: https://images.unsplash.com";

    /** Separator between CSP source expressions. */
    public static final String CSP_SOURCE_SEPARATOR = " ";

    /** Media type of error bodies: RFC 9457 problem details, explicitly UTF-8 (Safari otherwise reads error bodies as Latin-1). */
    public static final MediaType PROBLEM_JSON_UTF8 = new MediaType(MediaType.APPLICATION_PROBLEM_JSON, StandardCharsets.UTF_8);

    /** Prefix of the problem {@code type} URN; the lower-cased error code is appended. */
    public static final String PROBLEM_TYPE_PREFIX = "urn:wander:problem:";

    /** Problem extension member: stable machine-readable error code. */
    public static final String PROBLEM_PROPERTY_CODE = "code";

    /** Problem extension member: name of the invalid input field. */
    public static final String PROBLEM_PROPERTY_FIELD = "field";

    /** Problem extension member: structured details. */
    public static final String PROBLEM_PROPERTY_DETAILS = "details";

    /** Underscore, replaced by a hyphen in problem type URNs. */
    public static final char UNDERSCORE = '_';

    /** Hyphen used in problem type URNs. */
    public static final char HYPHEN = '-';

    /** Path prefixes of the API documentation (Swagger UI and the OpenAPI document), served outside the free profile. */
    public static final String[] DOCS_PATH_PREFIXES = {"/swagger-ui", "/v3/api-docs"};

    /**
     * CSP for the API documentation pages only: the same strict policy except that Swagger UI's own inline styles are allowed and
     * it may not load anything but images from this origin or data URIs. Never applied to the application itself.
     */
    public static final String VALUE_CONTENT_SECURITY_POLICY_DOCS = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
            + "img-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";

    /** Separator between a URL scheme and the authority. */
    public static final String SCHEME_SEPARATOR = "://";

    /** Separator between a host and its port. */
    public static final String PORT_SEPARATOR = ":";

    /** The https URL scheme. */
    public static final String SCHEME_HTTPS = "https";

    /** Property with the optional external origin of the catalog photos; same property the catalog module reads. */
    public static final String PHOTO_BASE_URL_EXPRESSION = "${wander.catalog.photo-base-url:}";

    /**
     * A strict CSP: no external scripts, no framing, same origin only, EXCEPT the two map servers approved in ADR-015
     * (style, vector tiles, fonts and sprites at tiles.openfreemap.org; elevation tiles at s3.amazonaws.com) and the {@code blob:} workers/images
     * that MapLibre GL creates, plus Unsplash photos loaded directly from images.unsplash.com (DR-034: the Unsplash terms require hotlinking). No wildcards.
     */
    public static final String VALUE_CONTENT_SECURITY_POLICY = "default-src 'self'; script-src 'self'; style-src 'self'; "
            + CSP_IMG_SRC_DEFAULT + "; connect-src 'self' https://tiles.openfreemap.org https://s3.amazonaws.com; "
            + "worker-src 'self' blob:; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";

    /**
     * The content type of the JSON error body, stating UTF-8 explicitly: Spring drops `charset` from `application/json`, so Safari opening an error URL directly
     * reads the body as Latin-1 and breaks Vietnamese (the app reads with `fetch().json()`, which is always UTF-8, so it is not affected).
     */
    public static final MediaType JSON_UTF8 = new MediaType(MediaType.APPLICATION_JSON, StandardCharsets.UTF_8);

    /** The file extension of the web app manifest (without the dot). */
    public static final String WEB_MANIFEST_EXTENSION = "webmanifest";

    /** The content type of the web app manifest; iOS Safari needs exactly this type to use the manifest (to run full-screen when Added to the Home Screen). */
    public static final String WEB_MANIFEST_MEDIA_TYPE = "application/manifest+json";

    private HttpConstants() {
    }
}
