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

    /** Chuyến CÒN HIỆN theo mã mà người này là thành viên (mọi vai), kèm mọi mục; người ngoài và chuyến đã xóa coi như không có (404, INV-6). */
    Optional<Trip> findAccessible(UUID tripId, UUID identityId);

    /** Chuyến ĐÃ XÓA MỀM của đúng chủ (để khôi phục); {@link #findOwned} không trả chuyến đã xóa. */
    Optional<Trip> findOwnedDeleted(UUID tripId, UUID ownerId);

    /** Chuyến còn hiện mà liên kết mời (theo băm mã) thuộc về — kể cả liên kết hết hạn/đã thu hồi, domain tự quyết có dùng được không. */
    Optional<Trip> findByInviteHash(String codeHash);

    /** Lưu chuyến (thêm mới hoặc cập nhật); phiên bản lệch thì ném lỗi khóa lạc quan. */
    void save(Trip trip);

    /** Tên mọi chuyến của chủ, theo mã chuyến; dùng để đặt tên không trùng (DR-006). */
    Map<UUID, String> tripNamesOf(UUID ownerId);
}
