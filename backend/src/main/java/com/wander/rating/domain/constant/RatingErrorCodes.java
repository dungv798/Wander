package com.wander.rating.domain.constant;

/** Mã lỗi riêng của rating (hợp đồng API, xem docs/ux/error-codes.md). */
public final class RatingErrorCodes {

    /** Danh tính đã chấm đủ số quán tối đa. */
    public static final String RATING_LIMIT_REACHED = "RATING_LIMIT_REACHED";

    /** Không thể báo cáo lời bình của chính mình. */
    public static final String CANNOT_REPORT_OWN = "CANNOT_REPORT_OWN";

    private RatingErrorCodes() {
    }
}
