package com.wander.planning.application.query;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** A flat trip row of the read side. {@code styles} is comma-separated codes (empty = none). */
public record TripRow(UUID id, UUID ownerId, String name, String destination, LocalDate startDate, LocalDate endDate,
               Long budgetK, String styles, String pace, boolean datesTentative, String kind, String interests,
               Instant createdAt, Instant updatedAt, Instant deletedAt, String role, long memberCount, UUID selfMemberId, String cover) {
}
