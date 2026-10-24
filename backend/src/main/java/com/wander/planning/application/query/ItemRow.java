package com.wander.planning.application.query;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/** Dòng mục phẳng của phía đọc (kể cả mục đã xóa mềm). */
public record ItemRow(UUID id, UUID tripId, LocalDate day, int position, String type, String title, LocalTime timeOfDay,
               Integer durationMin, String note, Long costK, boolean included, Long referenceK, Instant deletedAt,
               Instant createdAt) {
}
