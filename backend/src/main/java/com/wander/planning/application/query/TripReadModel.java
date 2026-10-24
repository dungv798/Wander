package com.wander.planning.application.query;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Cổng đọc (phía Query của CQRS): trả về dòng dữ liệu phẳng, không nạp aggregate.
 * Cài đặt bằng JPQL trong infrastructure. Phía đọc có thể tối ưu riêng (index, view, cache) mà không đụng domain.
 */
public interface TripReadModel {

    Optional<TripRow> findTrip(UUID tripId, UUID ownerId);

    /** Chuyến của chủ, mới nhất trước (ngày đi giảm dần, rồi thời điểm tạo giảm dần). */
    List<TripRow> listTrips(UUID ownerId);

    /** Mọi mục (kể cả đã xóa mềm), theo ngày rồi thứ tự thủ công. */
    List<ItemRow> items(UUID tripId);

    Optional<ItemRow> item(UUID tripId, UUID itemId);

    /** Mục đã xóa mềm, xóa gần nhất trước. */
    List<ItemRow> trash(UUID tripId);

    Set<UUID> doneItemIds(UUID tripId, UUID personId);
}
