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

    /** Chuyến theo mã của đúng chủ; chuyến của người khác coi như không có. */
    Optional<TripRow> findTrip(UUID tripId, UUID ownerId);

    /** Chuyến của chủ, mới nhất trước (ngày đi giảm dần, rồi thời điểm tạo giảm dần). */
    List<TripRow> listTrips(UUID ownerId);

    /** Mọi mục (kể cả đã xóa mềm), theo ngày rồi thứ tự thủ công. */
    List<ItemRow> items(UUID tripId);

    /** Một mục của chuyến theo mã (kể cả đã xóa mềm). */
    Optional<ItemRow> item(UUID tripId, UUID itemId);

    /** Mục đã xóa mềm, xóa gần nhất trước. */
    List<ItemRow> trash(UUID tripId);

    /** Mã các mục mà người này đã đánh dấu hoàn thành. */
    Set<UUID> doneItemIds(UUID tripId, UUID personId);
}
