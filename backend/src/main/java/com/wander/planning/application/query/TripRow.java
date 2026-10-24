package com.wander.planning.application.query;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** Dòng chuyến phẳng của phía đọc. */
public record TripRow(UUID id, UUID ownerId, String name, String destination, LocalDate startDate, LocalDate endDate,
               Instant createdAt, Instant updatedAt) {
}
