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

/** Spring Data JPA repository of the venue rating scores. */
public interface PlaceRatingJpaRepository extends JpaRepository<PlaceRatingEntity, UUID> {

    /** The identity's score for the venue. */
    Optional<PlaceRatingEntity> findByIdentityIdAndPlaceRef(UUID identityId, String placeRef);

    /** Whether the identity has rated this venue (without loading the entity into the session). */
    boolean existsByIdentityIdAndPlaceRef(UUID identityId, String placeRef);

    /** The number of ratings of the venue. */
    long countByPlaceRef(String placeRef);

    /** The number of venues the identity has rated. */
    long countByIdentityId(UUID identityId);

    /** Deletes the identity's score for the venue; returns the number of rows deleted. */
    long deleteByIdentityIdAndPlaceRef(UUID identityId, String placeRef);

    /** The average score of the venue (null when there are no ratings yet). */
    @Query(RatingQueryConstants.AVERAGE_STARS)
    Double averageStars(@Param("ref") String placeRef);

    /** Comments that are not hidden, newest first, limited by page. */
    @Query(RatingQueryConstants.VISIBLE_COMMENTS)
    List<PlaceRatingEntity> visibleComments(@Param("ref") String placeRef, @Param("threshold") long threshold, Pageable page);

    /** Writes or updates the score in one statement. */
    @Modifying(clearAutomatically = true)
    @Query(value = RatingQueryConstants.UPSERT_RATING, nativeQuery = true)
    void upsert(@Param("id") UUID id, @Param("identity") UUID identity, @Param("ref") String placeRef, @Param("stars") int stars,
                @Param("comment") String comment, @Param("now") Instant now);

    /** Deletes the reports of the rating when the new comment differs from the stored one (called BEFORE writing). */
    @Modifying
    @Query(value = RatingQueryConstants.CLEAR_REPORTS_OF_RATING, nativeQuery = true)
    void clearReports(@Param("identity") UUID identity, @Param("ref") String placeRef, @Param("comment") String comment);

    /** Records a report, ignored if it already exists. */
    @Modifying
    @Query(value = RatingQueryConstants.INSERT_REPORT, nativeQuery = true)
    void insertReport(@Param("rating") UUID rating, @Param("reporter") UUID reporter, @Param("now") Instant now);
}
