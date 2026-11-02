package com.wander.rating.domain.constant;

/** Hằng số của rating Wander (DR-032). */
public final class RatingConstants {

    /** Điểm thấp nhất. */
    public static final int STARS_MIN = 1;

    /** Điểm cao nhất. */
    public static final int STARS_MAX = 5;

    /** Độ dài tối đa của lời bình, tính theo code point (khớp độ dài cột của DB). */
    public static final int COMMENT_MAX_LENGTH = 280;

    /** Độ dài tối đa của mã quán (khớp độ dài cột của DB). */
    public static final int PLACE_REF_MAX_LENGTH = 64;

    /** Dạng mã quán hợp lệ: chữ, số và : _ . - tối đa 64 ký tự (mã POI/quán trong catalog). */
    public static final String PLACE_REF_REGEX = "^[A-Za-z0-9:_.-]{1,64}$";

    /** Số người báo cáo khác nhau để ẩn một lời bình. */
    public static final int REPORT_HIDE_THRESHOLD = 3;

    /** Số lời bình mới nhất trả về cho một quán. */
    public static final int COMMENTS_PAGE_SIZE = 10;

    /** Số quán tối đa một danh tính được chấm (chặn làm đầy DB bằng mã quán tùy ý). */
    public static final int MAX_RATINGS_PER_IDENTITY = 1000;

    /** Hệ số làm tròn điểm trung bình đến một chữ số thập phân. */
    public static final double AVERAGE_ROUNDING_FACTOR = 10.0;

    private RatingConstants() {
    }
}
