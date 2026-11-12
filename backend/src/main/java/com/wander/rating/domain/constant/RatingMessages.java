package com.wander.rating.domain.constant;

/** Error messages of rating (Vietnamese, shown to the user). */
public final class RatingMessages {

    /** The score is not within 1-5. */
    public static final String STARS_OUT_OF_RANGE = "Điểm phải là số nguyên từ 1 đến 5.";

    /** The allowed number of venues has already been rated. */
    public static final String RATING_LIMIT_REACHED = "Bạn đã chấm đủ số quán cho phép.";

    /** Reporting one's own comment. */
    public static final String CANNOT_REPORT_OWN = "Bạn không thể báo cáo lời bình của chính mình.";

    private RatingMessages() {
    }
}
