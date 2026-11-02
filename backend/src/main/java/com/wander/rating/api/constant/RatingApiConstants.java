package com.wander.rating.api.constant;

/** Đường dẫn và khóa JSON của API rating. */
public final class RatingApiConstants {

    /** Tiền tố đường dẫn của một quán. */
    public static final String PLACE_PATH = "/api/places/{placeRef}";

    /** Rating của quán (xem, chấm, xóa). */
    public static final String RATING_PATH = "/rating";

    /** Báo cáo một lời bình. */
    public static final String REPORT_PATH = "/ratings/{ratingId}/report";

    /** Khóa JSON của read model rating trong phản hồi. */
    public static final String KEY_RATING = "rating";

    private RatingApiConstants() {
    }
}
