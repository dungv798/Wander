package com.wander.rating.domain.port;

import com.wander.rating.domain.model.PlaceComment;
import com.wander.rating.domain.model.PlaceRating;
import com.wander.rating.domain.model.RatingSummary;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Cổng lưu trữ rating Wander. */
public interface RatingStore {

    /** Điểm của danh tính cho quán, nếu có. */
    Optional<PlaceRating> findMine(UUID identityId, String placeRef);

    /** Danh tính đã chấm quán này chưa. */
    boolean exists(UUID identityId, String placeRef);

    /** Điểm theo mã, nếu có. */
    Optional<PlaceRating> findById(UUID ratingId);

    /** Số quán danh tính đã chấm. */
    long countByIdentity(UUID identityId);

    /** Ghi hoặc cập nhật điểm của danh tính cho quán trong một câu lệnh (an toàn khi hai yêu cầu cùng lúc). */
    void upsert(UUID identityId, String placeRef, int stars, String comment, Instant now);

    /** Xóa điểm của danh tính cho quán; trả true nếu có xóa. */
    boolean delete(UUID identityId, String placeRef);

    /** Điểm tổng hợp của quán. */
    RatingSummary summary(String placeRef);

    /** Các lời bình mới nhất chưa bị ẩn của quán. */
    List<PlaceComment> latestComments(String placeRef, int limit);

    /** Ghi báo cáo (bỏ qua nếu người này đã báo cáo lời bình đó). */
    void addReport(UUID ratingId, UUID reporterId, Instant now);
}
