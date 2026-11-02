package com.wander.rating.domain.constant;

/** Lời báo lỗi của rating (tiếng Việt, hiển thị cho người dùng). */
public final class RatingMessages {

    /** Điểm không nằm trong 1–5. */
    public static final String STARS_OUT_OF_RANGE = "Điểm phải là số nguyên từ 1 đến 5.";

    /** Đã chấm đủ số quán cho phép. */
    public static final String RATING_LIMIT_REACHED = "Bạn đã chấm đủ số quán cho phép.";

    /** Báo cáo lời bình của chính mình. */
    public static final String CANNOT_REPORT_OWN = "Bạn không thể báo cáo lời bình của chính mình.";

    private RatingMessages() {
    }
}
