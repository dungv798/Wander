package com.wander.planning.application.query;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/** Dòng mục phẳng của phía đọc (kể cả mục đã xóa mềm). {@code day} null = "Chưa có ngày"; {@code placeId} null = mục tự do. */
public record ItemRow(UUID id, UUID tripId, LocalDate day, int position, String type, String title, LocalTime timeOfDay,
               Integer durationMin, String note, Long costK, boolean included, Long referenceK, String bookingStatus,
               String placeId, Instant deletedAt, Instant createdAt) {

    /** Bản sao với vị trí khác (dùng khi đổi vị trí lưu thành thứ hạng hiển thị). */
    public ItemRow withPosition(int newPosition) {
        return new ItemRow(id, tripId, day, newPosition, type, title, timeOfDay, durationMin, note, costK, included, referenceK,
                bookingStatus, placeId, deletedAt, createdAt);
    }
}
