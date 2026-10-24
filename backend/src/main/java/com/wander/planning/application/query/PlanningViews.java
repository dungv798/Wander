package com.wander.planning.application.query;

import java.util.List;

/**
 * Read model trả cho giao diện. Tên trường giữ nguyên hợp đồng API cũ (web/src/api.ts) để giao diện không phải đổi.
 */
public final class PlanningViews {

    private PlanningViews() {
    }

    public record TripView(String id, String name, String destination, String startDate, String endDate,
                           String createdAt, String updatedAt) {
    }

    public record ItemView(String id, String tripId, String day, int position, String type, String typeLabel,
                           String title, String timeOfDay, Integer durationMin, String note, Long costK,
                           String costFormatted, boolean included, Long referenceK, String referenceFormatted,
                           boolean done, String deletedAt) {
    }

    public record DayView(String date, int index, int weekday, String weekdayLabel, List<ItemView> items) {
    }

    public record DayTotal(String date, long extraK, String extraFormatted) {
    }

    public record TypeTotal(String type, String typeLabel, long extraK, String extraFormatted) {
    }

    public record Totals(long extraK, String extraFormatted, List<DayTotal> byDay, List<TypeTotal> byType) {
    }

    public record PendingTask(String id, String day, String title, String timeOfDay) {
    }

    public record TripDetail(TripView trip, int dayCount, List<DayView> days, Totals totals,
                             List<PendingTask> pendingTasks, int trashCount) {
    }
}
