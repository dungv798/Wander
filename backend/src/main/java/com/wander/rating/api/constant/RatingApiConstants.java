package com.wander.rating.api.constant;

/** Paths and JSON keys of the rating API. */
public final class RatingApiConstants {

    /** Path prefix of one venue. */
    public static final String PLACE_PATH = "/api/places/{placeRef}";

    /** The rating of a venue (view, rate, delete). */
    public static final String RATING_PATH = "/rating";

    /** Report a comment. */
    public static final String REPORT_PATH = "/ratings/{ratingId}/report";

    /** Lowest star value, as documented in the OpenAPI schema. */
    public static final String STARS_MIN = "1";

    /** Highest star value, as documented in the OpenAPI schema. */
    public static final String STARS_MAX = "5";

    /** Maximum comment length, as documented in the OpenAPI schema (the rating rules enforce it). */
    public static final int COMMENT_MAX = 280;

    private RatingApiConstants() {
    }
}
