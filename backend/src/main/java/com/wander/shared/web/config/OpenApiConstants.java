package com.wander.shared.web.config;

/** Texts of the generated OpenAPI document ({@link OpenApiConfig}). */
public final class OpenApiConstants {

    /** Name of the bearer security scheme referenced by operations. */
    public static final String BEARER_SCHEME = "bearerAuth";

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

    private OpenApiConstants() {
    }
}
