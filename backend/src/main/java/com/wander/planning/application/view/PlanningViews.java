package com.wander.planning.application.view;

import java.util.List;

/**
 * Read model trả cho giao diện. Tên trường giữ nguyên hợp đồng API cũ (web/src/api.ts) để giao diện không phải đổi;
 * lát 2 chỉ thêm trường (additive): {@code placeId}, {@code unscheduled}, {@code unscheduledK}; {@code day} có thể null.
 */
public final class PlanningViews {

    private PlanningViews() {
    }

    /** Một lựa chọn có mã và nhãn tiếng Việt (kiểu chuyến, nhịp). */
    public record Choice(String code, String label) {
    }

    public record TripView(String id, String name, String destination, String startDate, String endDate,
                           Long budgetK, String budgetFormatted, List<Choice> styles, Choice pace,
                           boolean datesTentative, Choice kind, List<Choice> interests, String createdAt, String updatedAt) {
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
                           String booking, String bookingLabel, boolean done, String deletedAt) {
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
}
