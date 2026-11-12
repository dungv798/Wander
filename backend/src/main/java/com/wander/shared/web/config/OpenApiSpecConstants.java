package com.wander.shared.web.config;

/** Texts of the generated OpenAPI document ({@link OpenApiConfig}). */
public final class OpenApiSpecConstants {

    /** Name of the bearer security scheme referenced by operations. */
    public static final String BEARER_SCHEME = "bearerAuth";

    /** The API is served from the same origin as the page: a relative server URL keeps the committed document independent of the host. */
    static final String SERVER_URL = "/";

    /** Document title. */
    static final String TITLE = "Wander API";

    /** API version (the contract version, not the application build). Paths are intentionally not versioned: see ADR-017. */
    static final String VERSION = "1.0";

    /** Short description shown at the top of the document. */
    static final String DESCRIPTION = "Trip planning API: anonymous identity and recovery, trips, days, items and costs, sharing, "
            + "and the read-only place catalog. Errors are RFC 9457 problem details with a stable `code` member.";

    /** HTTP authentication scheme name. */
    static final String BEARER = "bearer";

    /** How to obtain and send the session token. */
    static final String BEARER_DESCRIPTION = "Opaque session token returned by POST /api/identity (or by device pairing / recovery), "
            + "sent as `Authorization: Bearer <token>`.";

    /** Description of a value that may be a JSON number or a string of digits. */
    static final String FLEXIBLE_NUMBER = "A whole number, sent either as a JSON number or as a string of digits (empty string means not provided).";

    /** Component name of the shared error schema. */
    static final String PROBLEM_SCHEMA = "Problem";

    /** Description of the default response of every operation. */
    static final String PROBLEM_RESPONSE = "Any error: an RFC 9457 problem. Switch on the stable `code`; `field` names the invalid input.";

    /** Description of the {@code code} member. */
    static final String PROBLEM_CODE = "Stable machine-readable error code, for example REQUIRED, NOT_FOUND or CONCURRENT_MODIFICATION.";

    /** Name of the {@code status} member of the problem schema. */
    static final String PROBLEM_STATUS = "status";

    /** Name of the {@code code} member of the problem schema. */
    static final String PROBLEM_CODE_MEMBER = "code";

    /** Prefix of a reference to a component schema. */
    static final String SCHEMA_REF_PREFIX = "#/components/schemas/";

    /** Media type of error responses. */
    static final String PROBLEM_MEDIA_TYPE = "application/problem+json";

    /** Name of the default response entry. */
    static final String DEFAULT_RESPONSE = "default";

    /** Names of the members of the problem schema. */
    static final String[] PROBLEM_TEXT_MEMBERS = {"type", "title", "detail", "instance", "code", "field"};

    private OpenApiSpecConstants() {
    }
}
