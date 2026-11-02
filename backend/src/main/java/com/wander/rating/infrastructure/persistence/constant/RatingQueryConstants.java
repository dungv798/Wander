package com.wander.rating.infrastructure.persistence.constant;

/** Câu truy vấn của rating (JPQL và SQL thuần cho các thao tác cần một câu lệnh nguyên tử). */
public final class RatingQueryConstants {

    /** Điểm trung bình của quán. */
    public static final String AVERAGE_STARS = "select avg(r.stars) from PlaceRatingEntity r where r.placeRef = :ref";

    /** Lời bình chưa bị ẩn (ít hơn ngưỡng người báo cáo khác nhau), mới nhất trước. */
    public static final String VISIBLE_COMMENTS = "select r from PlaceRatingEntity r where r.placeRef = :ref and r.comment is not null "
            + "and (select count(p) from RatingReportEntity p where p.ratingId = r.id) < :threshold order by r.updatedAt desc";

    /** Ghi hoặc cập nhật điểm của danh tính cho quán trong một câu lệnh; khóa duy nhất (identity_id, place_ref). */
    public static final String UPSERT_RATING = "INSERT INTO place_ratings (id, identity_id, place_ref, stars, comment, created_at, updated_at) "
            + "VALUES (:id, :identity, :ref, :stars, CAST(:comment AS varchar), :now, :now) "
            + "ON CONFLICT (identity_id, place_ref) DO UPDATE SET stars = EXCLUDED.stars, comment = EXCLUDED.comment, "
            + "updated_at = EXCLUDED.updated_at";

    /** Xóa báo cáo của lời bình khi tác giả lưu lại với nội dung KHÁC (báo cáo cũ nhắm vào nội dung cũ); giữ nguyên khi chỉ đổi sao hoặc gửi lại đúng chữ cũ. */
    public static final String CLEAR_REPORTS_OF_RATING = "DELETE FROM place_rating_reports WHERE rating_id IN "
            + "(SELECT id FROM place_ratings WHERE identity_id = :identity AND place_ref = :ref "
            + "AND comment IS DISTINCT FROM CAST(:comment AS varchar))";

    /** Ghi báo cáo, bỏ qua nếu người này đã báo cáo lời bình đó hoặc lời bình đã bị tác giả xóa trong lúc đó (không lỗi khóa ngoại). */
    public static final String INSERT_REPORT = "INSERT INTO place_rating_reports (rating_id, reporter_id, created_at) "
            + "SELECT :rating, :reporter, :now WHERE EXISTS (SELECT 1 FROM place_ratings WHERE id = :rating) "
            + "ON CONFLICT (rating_id, reporter_id) DO NOTHING";

    private RatingQueryConstants() {
    }
}
