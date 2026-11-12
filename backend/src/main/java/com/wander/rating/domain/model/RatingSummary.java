package com.wander.rating.domain.model;

/** The aggregate score of a venue: the average (null when there are no ratings yet) and the number of ratings. */
public record RatingSummary(Double average, long count) {
}
