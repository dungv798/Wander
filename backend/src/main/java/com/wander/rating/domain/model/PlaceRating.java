package com.wander.rating.domain.model;

import java.time.Instant;
import java.util.UUID;

/** Điểm của một danh tính cho một quán, kèm lời bình tùy chọn. */
public record PlaceRating(UUID id, UUID identityId, String placeRef, int stars, String comment, Instant createdAt, Instant updatedAt) {
}
