package com.wander.planning.domain.port;

import com.wander.planning.domain.model.ChecklistItem;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Cổng lưu checklist chuẩn bị. Quyền truy cập chuyến do lớp ứng dụng kiểm TRƯỚC khi gọi cổng này. */
public interface ChecklistRepository {

    /** Hạng mục của chuyến theo thứ tự hiển thị (nhóm, vị trí). */
    List<ChecklistItem> listOf(UUID tripId);

    /** Một hạng mục của đúng chuyến (hạng mục của chuyến khác coi như không có). */
    Optional<ChecklistItem> find(UUID tripId, UUID itemId);

    /** Số hạng mục của chuyến. */
    int countOf(UUID tripId);

    /** Vị trí kế tiếp (lớn nhất + 1; 0 nếu chưa có). */
    int nextPosition(UUID tripId);

    /** Thêm mới hoặc cập nhật hạng mục (kể cả dấu hoàn thành). */
    void save(ChecklistItem item);

    /** Xóa hẳn một hạng mục của đúng chuyến; trả true nếu có xóa. */
    boolean delete(UUID tripId, UUID itemId);
}
