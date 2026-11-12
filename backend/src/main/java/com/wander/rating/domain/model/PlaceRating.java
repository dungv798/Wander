package com.wander.rating.domain.model;

import java.time.Instant;
import java.util.UUID;

/** The score of one identity for one venue, with an optional comment. */
public record PlaceRating(UUID id, UUID identityId, String placeRef, int stars, String comment, Instant createdAt, Instant updatedAt) {
}
