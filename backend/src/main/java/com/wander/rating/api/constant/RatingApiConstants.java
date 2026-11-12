package com.wander.rating.api.constant;

/** Đường dẫn và khóa JSON của API rating. */
public final class RatingApiConstants {

    /** Tiền tố đường dẫn của một quán. */
    public static final String PLACE_PATH = "/api/places/{placeRef}";

    /** Rating của quán (xem, chấm, xóa). */
    public static final String RATING_PATH = "/rating";

    /** Báo cáo một lời bình. */
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
