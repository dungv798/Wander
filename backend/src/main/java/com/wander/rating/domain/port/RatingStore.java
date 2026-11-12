package com.wander.rating.domain.port;

import com.wander.rating.domain.model.PlaceComment;
import com.wander.rating.domain.model.PlaceRating;
import com.wander.rating.domain.model.RatingSummary;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** The storage port of Wander rating. */
public interface RatingStore {

    /** The identity's score for the venue, if any. */
    Optional<PlaceRating> findMine(UUID identityId, String placeRef);

    /** Whether the identity has rated this venue. */
    boolean exists(UUID identityId, String placeRef);

    /** The score by id, if any. */
    Optional<PlaceRating> findById(UUID ratingId);

    /** The number of venues the identity has rated. */
    long countByIdentity(UUID identityId);

    /** Writes or updates the identity's score for the venue in one statement (safe when two requests arrive at the same time). */
    void upsert(UUID identityId, String placeRef, int stars, String comment, Instant now);

    /** Deletes the identity's score for the venue; returns true if something was deleted. */
    boolean delete(UUID identityId, String placeRef);

    /** The aggregate score of the venue. */
    RatingSummary summary(String placeRef);

    /** The venue's newest comments that are not hidden. */
    List<PlaceComment> latestComments(String placeRef, int limit);

    /** Records a report (ignored if this person has already reported that comment). */
    void addReport(UUID ratingId, UUID reporterId, Instant now);
}
