package com.wander.rating.infrastructure.persistence.adapter;

import com.wander.rating.domain.constant.RatingConstants;
import com.wander.rating.domain.model.PlaceComment;
import com.wander.rating.domain.model.PlaceRating;
import com.wander.rating.domain.model.RatingSummary;
import com.wander.rating.domain.port.RatingStore;
import com.wander.rating.infrastructure.persistence.entity.PlaceRatingEntity;
import com.wander.rating.infrastructure.persistence.repository.PlaceRatingJpaRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Repository;

/** Cài đặt {@link RatingStore} bằng JPA và SQL thuần cho thao tác ghi nguyên tử. */
@Repository
public class JpaRatingStore implements RatingStore {

    private final PlaceRatingJpaRepository ratings;

    /** Nhận repository của điểm rating. */
    public JpaRatingStore(PlaceRatingJpaRepository ratings) {
        this.ratings = ratings;
    }

    @Override
    public Optional<PlaceRating> findMine(UUID identityId, String placeRef) {
        return ratings.findByIdentityIdAndPlaceRef(identityId, placeRef).map(JpaRatingStore::toDomain);
    }

    @Override
    public boolean exists(UUID identityId, String placeRef) {
        return ratings.existsByIdentityIdAndPlaceRef(identityId, placeRef);
    }

    @Override
    public Optional<PlaceRating> findById(UUID ratingId) {
        return ratings.findById(ratingId).map(JpaRatingStore::toDomain);
    }

    @Override
    public long countByIdentity(UUID identityId) {
        return ratings.countByIdentityId(identityId);
    }

    @Override
    public void upsert(UUID identityId, String placeRef, int stars, String comment, Instant now) {
        ratings.clearReports(identityId, placeRef, comment);
        ratings.upsert(UUID.randomUUID(), identityId, placeRef, stars, comment, now);
    }

    @Override
    public boolean delete(UUID identityId, String placeRef) {
        return ratings.deleteByIdentityIdAndPlaceRef(identityId, placeRef) > 0;
    }

    @Override
    public RatingSummary summary(String placeRef) {
        return new RatingSummary(ratings.averageStars(placeRef), ratings.countByPlaceRef(placeRef));
    }

    @Override
    public List<PlaceComment> latestComments(String placeRef, int limit) {
        return ratings.visibleComments(placeRef, RatingConstants.REPORT_HIDE_THRESHOLD, PageRequest.of(0, limit)).stream()
                .map(entity -> new PlaceComment(entity.getId(), entity.getIdentityId(), entity.getStars(), entity.getComment(), entity.getUpdatedAt()))
                .toList();
    }

    @Override
    public void addReport(UUID ratingId, UUID reporterId, Instant now) {
        ratings.insertReport(ratingId, reporterId, now);
    }

    /** Đổi entity sang mô hình domain. */
    private static PlaceRating toDomain(PlaceRatingEntity entity) {
        return new PlaceRating(entity.getId(), entity.getIdentityId(), entity.getPlaceRef(), entity.getStars(), entity.getComment(),
                entity.getCreatedAt(), entity.getUpdatedAt());
    }
}
