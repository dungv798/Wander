package com.wander.planning.application.query;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/** A flat item row of the read side (including soft-deleted items). {@code day} null = 'no date yet'; {@code placeId} null = a free-form item. */
public record ItemRow(UUID id, UUID tripId, LocalDate day, int position, String type, String title, LocalTime timeOfDay,
               Integer durationMin, String note, Long costK, boolean included, Long referenceK, String bookingStatus,
               String placeId, Instant deletedAt, Instant createdAt, UUID addedByMemberId) {

    /** A copy with another position (used when the stored position is turned into a display rank). */
    public ItemRow withPosition(int newPosition) {
        return new ItemRow(id, tripId, day, newPosition, type, title, timeOfDay, durationMin, note, costK, included, referenceK,
                bookingStatus, placeId, deletedAt, createdAt, addedByMemberId);
    }
}
