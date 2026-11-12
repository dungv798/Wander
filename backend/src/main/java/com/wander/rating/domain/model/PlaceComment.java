package com.wander.rating.domain.model;

import java.time.Instant;
import java.util.UUID;

/** A displayed comment of a venue (hidden comments excluded); {@code identityId} is only to know whether it is the viewer's own. */
public record PlaceComment(UUID ratingId, UUID identityId, int stars, String comment, Instant updatedAt) {
}
