package com.wander.rating.application.input;

/** JSON field names and parameters of the rating API. */
public final class RatingFields {

    /** The score 1-5. */
    public static final String STARS = "stars";

    /** A short comment. */
    public static final String COMMENT = "comment";

    /** The venue id. */
    public static final String PLACE_REF = "placeRef";

    private RatingFields() {
    }
}
