package com.wander.planning.application.command;

import java.util.Map;
import java.util.UUID;

/**
 * Lệnh (phía ghi của CQRS). Mỗi lệnh là một ý định thay đổi; trả về định danh, còn dữ liệu hiển thị
 * lấy qua phía đọc ({@code PlanningQueries}).
 * <p>
 * {@code input} là đối tượng JSON thô của API: quy tắc định dạng (D17…) được kiểm tra trong handler,
 * sau khi đã nạp aggregate, để thứ tự lỗi khớp hợp đồng API (ví dụ mục đã xóa ⇒ ITEM_DELETED trước lỗi trường).
 */
public final class PlanningCommands {

    private PlanningCommands() {
    }

    public record DeleteTrip(UUID ownerId, UUID tripId) {
    }

    /** Khôi phục một chuyến đã xóa mềm. */
    public record RestoreTrip(UUID ownerId, UUID tripId) {
    }

    public record CreateTrip(UUID ownerId, Map<String, Object> input) {
    }

    public record UpdateTrip(UUID ownerId, UUID tripId, Map<String, Object> input) {
    }

    public record AddItem(UUID ownerId, UUID tripId, Map<String, Object> input) {
    }

    public record EditItem(UUID ownerId, UUID tripId, UUID itemId, Map<String, Object> input) {
    }

    public record ReorderDay(UUID ownerId, UUID tripId, String day, Object orderedIds) {
    }

    public record SoftDeleteItem(UUID ownerId, UUID tripId, UUID itemId) {
    }

    public record RestoreItem(UUID ownerId, UUID tripId, UUID itemId) {
    }

    public record PurgeItem(UUID ownerId, UUID tripId, UUID itemId) {
    }

    public record SetTaskDone(UUID ownerId, UUID tripId, UUID itemId, Object done) {
    }

    /** Thay toàn bộ sở thích theo danh tính (BE-10); {@code input} là thân JSON thô có khóa {@code interests}. */
    public record SetInterestPreferences(UUID ownerId, Map<String, Object> input) {
    }

    /**
     * Lệnh "lịch": tùy chọn đổi khoảng ngày chuyến và gán ngày hàng loạt cho các mục, tất cả trong một giao dịch và một lần
     * tăng phiên bản. Gửi lại trạng thái cũ là cách Hoàn tác (kể cả Hoàn tác đổi khoảng ngày).
     */
    public record ApplySchedule(UUID ownerId, UUID tripId, Map<String, Object> input) {
    }
}
