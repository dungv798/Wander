package com.wander.rating.infrastructure.persistence.repository;

import com.wander.rating.infrastructure.persistence.constant.RatingQueryConstants;
import com.wander.rating.infrastructure.persistence.entity.PlaceRatingEntity;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Spring Data JPA repository của điểm rating quán. */
public interface PlaceRatingJpaRepository extends JpaRepository<PlaceRatingEntity, UUID> {

    /** Điểm của danh tính cho quán. */
    Optional<PlaceRatingEntity> findByIdentityIdAndPlaceRef(UUID identityId, String placeRef);

    /** Danh tính đã chấm quán này chưa (không nạp entity vào bộ nhớ phiên). */
    boolean existsByIdentityIdAndPlaceRef(UUID identityId, String placeRef);

    /** Số lượt chấm của quán. */
    long countByPlaceRef(String placeRef);

    /** Số quán danh tính đã chấm. */
    long countByIdentityId(UUID identityId);

    /** Xóa điểm của danh tính cho quán; trả số dòng đã xóa. */
    long deleteByIdentityIdAndPlaceRef(UUID identityId, String placeRef);

    /** Điểm trung bình của quán (null khi chưa có lượt). */
    @Query(RatingQueryConstants.AVERAGE_STARS)
    Double averageStars(@Param("ref") String placeRef);

    /** Lời bình chưa bị ẩn, mới nhất trước, giới hạn theo trang. */
    @Query(RatingQueryConstants.VISIBLE_COMMENTS)
    List<PlaceRatingEntity> visibleComments(@Param("ref") String placeRef, @Param("threshold") long threshold, Pageable page);

    /** Ghi hoặc cập nhật điểm trong một câu lệnh. */
    @Modifying(clearAutomatically = true)
    @Query(value = RatingQueryConstants.UPSERT_RATING, nativeQuery = true)
    void upsert(@Param("id") UUID id, @Param("identity") UUID identity, @Param("ref") String placeRef, @Param("stars") int stars,
                @Param("comment") String comment, @Param("now") Instant now);

    /** Xóa báo cáo của điểm khi lời bình mới khác lời bình đang lưu (gọi TRƯỚC khi ghi). */
    @Modifying
    @Query(value = RatingQueryConstants.CLEAR_REPORTS_OF_RATING, nativeQuery = true)
    void clearReports(@Param("identity") UUID identity, @Param("ref") String placeRef, @Param("comment") String comment);

    /** Ghi báo cáo, bỏ qua nếu đã có. */
    @Modifying
    @Query(value = RatingQueryConstants.INSERT_REPORT, nativeQuery = true)
    void insertReport(@Param("rating") UUID rating, @Param("reporter") UUID reporter, @Param("now") Instant now);
}
