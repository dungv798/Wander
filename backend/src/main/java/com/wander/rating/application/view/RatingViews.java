package com.wander.rating.application.view;

import java.util.List;

/** Kết quả trả cho API rating. Danh tính tác giả không bao giờ lộ ra; chỉ có cờ {@code mine} cho người xem. */
public final class RatingViews {

    private RatingViews() {
    }

    /** Điểm tổng hợp của quán: trung bình một chữ số thập phân (null khi chưa có lượt) và số lượt. */
    public record Summary(Double average, long count) {
    }

    /** Điểm của chính người xem. */
    public record Mine(int stars, String comment, String updatedAt) {
    }

    /** Một lời bình hiển thị; {@code id} dùng để báo cáo. */
    public record CommentView(String id, int stars, String comment, String updatedAt, boolean mine) {
    }

    /** Rating của một quán dưới góc nhìn của người xem. */
    public record PlaceRatingView(Summary summary, Mine mine, List<CommentView> comments) {
    }
}
