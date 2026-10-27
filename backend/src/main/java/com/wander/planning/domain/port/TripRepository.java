package com.wander.planning.domain.port;

import com.wander.planning.domain.model.Trip;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Cổng (port) lưu aggregate Trip. Domain định nghĩa, infrastructure (JPA) cài đặt.
 * Chuyến của người khác được trả về như không tồn tại (INV-6): không tiết lộ chuyến có tồn tại.
 */
public interface TripRepository {

    /** Chuyến theo mã của đúng chủ, kèm mọi mục; chuyến của người khác coi như không có. */
    Optional<Trip> findOwned(UUID tripId, UUID ownerId);

    /** Lưu chuyến (thêm mới hoặc cập nhật); phiên bản lệch thì ném lỗi khóa lạc quan. */
    void save(Trip trip);

    /** Tên mọi chuyến của chủ, theo mã chuyến; dùng để đặt tên không trùng (DR-006). */
    Map<UUID, String> tripNamesOf(UUID ownerId);
}
