package com.wander.rating.domain.model;

import java.time.Instant;
import java.util.UUID;

/** Một lời bình hiển thị của một quán (đã loại lời bình bị ẩn); {@code identityId} chỉ để biết đó có phải của người xem không. */
public record PlaceComment(UUID ratingId, UUID identityId, int stars, String comment, Instant updatedAt) {
}
