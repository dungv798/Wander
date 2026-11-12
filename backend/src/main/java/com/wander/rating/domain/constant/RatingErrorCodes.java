package com.wander.rating.domain.constant;

/** Error codes specific to rating (the API contract, see docs/ux/error-codes.md). */
public final class RatingErrorCodes {

    /** The identity has rated the maximum number of venues. */
    public static final String RATING_LIMIT_REACHED = "RATING_LIMIT_REACHED";

    /** One cannot report one's own comment. */
    public static final String CANNOT_REPORT_OWN = "CANNOT_REPORT_OWN";

    private RatingErrorCodes() {
    }
}
