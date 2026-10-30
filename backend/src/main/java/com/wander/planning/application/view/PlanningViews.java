package com.wander.planning.application.view;

import java.util.List;

/**
 * Read model trả cho giao diện. Tên trường giữ nguyên hợp đồng API cũ (web/src/api.ts) để giao diện không phải đổi;
 * lát 2 chỉ thêm trường (additive): {@code placeId}, {@code unscheduled}, {@code unscheduledK}; {@code day} có thể null.
 */
public final class PlanningViews {

    private PlanningViews() {
    }

    /** Bìa trả dạng đối tượng; null ở TripView nghĩa là tự động. */
    public record CoverView(String kind, String ref) {
    }

    /** Một lựa chọn có mã và nhãn tiếng Việt (kiểu chuyến, nhịp). */
    public record Choice(String code, String label) {
    }

    public record TripView(String id, String name, String destination, String startDate, String endDate,
                           Long budgetK, String budgetFormatted, List<Choice> styles, Choice pace,
                           boolean datesTentative, Choice kind, List<Choice> interests, String createdAt, String updatedAt,
                       String role, int memberCount, String selfMemberId, CoverView cover) {
    }

    /**
     * Ngân sách dự kiến so với "Tổng phải trả thêm" (R2). {@code unknownCount} = số mục còn hiện chưa rõ giá: chúng KHÔNG
     * nằm trong tổng nên phần "còn lại" chỉ là mức tối đa có thể còn (D18). {@code gapK} luôn không âm; {@code over} cho biết
     * là vượt hay còn lại.
     */
    public record Budget(long budgetK, String budgetFormatted, long extraK, String extraFormatted, int unknownCount,
                         boolean over, long gapK, String gapFormatted) {
    }

    /**
     * Một mục. {@code day} null = "Chưa có ngày"; {@code placeId} null = mục tự do, còn lại là mã địa điểm trong kho
     * (phần tên, ảnh, tọa độ do giao diện ghép từ kho).
     */
    public record ItemView(String id, String tripId, String placeId, String day, int position, String type, String typeLabel,
                           String title, String timeOfDay, Integer durationMin, String note, Long costK,
                           String costFormatted, boolean included, Long referenceK, String referenceFormatted,
                           String booking, String bookingLabel, boolean done, String deletedAt, String addedBy, List<String> doneBy) {
    }

    /** Một thành viên của chuyến. KHÔNG có mã danh tính hay tên thiết bị; {@code self} đánh dấu chính người gọi. */
    public record MemberView(String id, String displayName, String role, String joinedAt, boolean self) {
    }

    /** Một đề nghị xóa. {@code requesterName} null nếu người đề nghị đã rời chuyến. KHÔNG có mã danh tính. */
    public record DeletionRequestView(String id, String itemId, String requesterId, String requesterName, String reason, String status,
                                      String requestedAt, String decidedAt) {
    }

    /** Trạng thái liên kết mời (không có mã). */
    public record InviteView(String id, String createdAt, String expiresAt, boolean active) {
    }

    /** Liên kết mới tạo: mã chỉ hiện đúng lần này. */
    public record CreatedInviteView(String id, String code, String expiresAt) {
    }

    /** Xem trước liên kết mời. */
    public record InvitePreviewView(String tripName, long memberCount) {
    }

    /** Chuyến trong "Chuyến đã xóa gần đây": chuyến và thời điểm xóa (ISO-8601). */
    public record DeletedTrip(TripView trip, String deletedAt) {
    }

    public record DayView(String date, int index, int weekday, String weekdayLabel, List<ItemView> items) {
    }

    public record DayTotal(String date, long extraK, String extraFormatted) {
    }

    public record TypeTotal(String type, String typeLabel, long extraK, String extraFormatted) {
    }

    /**
     * Tổng phải trả thêm (R2) của cả chuyến, gồm cả mục "Chưa có ngày" (DR-006). {@code unscheduledK} là phần của riêng các
     * mục chưa có ngày nên tổng {@code byDay} có thể nhỏ hơn {@code extraK}.
     */
    public record Totals(long extraK, String extraFormatted, long unscheduledK, String unscheduledFormatted,
                         List<DayTotal> byDay, List<TypeTotal> byType) {
    }

    /** Việc cần làm chưa xong; {@code day} null nếu việc chưa có ngày. */
    public record PendingTask(String id, String day, String title, String timeOfDay) {
    }

    /** Chi tiết chuyến. {@code unscheduled} là các mục còn hiện chưa có ngày, theo thứ tự thủ công. */
    public record TripDetail(TripView trip, int dayCount, List<DayView> days, List<ItemView> unscheduled, Totals totals,
                             List<PendingTask> pendingTasks, int trashCount, Budget budget) {
    }

    /** Một hạng mục checklist: {@code done} là của CHÍNH người gọi, {@code doneBy} là mã thành viên của những người đã xong. */
    public record ChecklistItemView(String id, String group, String title, int position, boolean done, List<String> doneBy) {
    }
}
