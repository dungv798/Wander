package com.wander.planning.application.view;

import java.util.List;

/**
 * The read model returned to the UI. Field names keep the old API contract (web/src/api.ts) so the UI does not have to change;
 * slice 2 only adds fields (additive): {@code placeId}, {@code unscheduled}, {@code unscheduledK}; {@code day} may be null.
 */
public final class PlanningViews {

    private PlanningViews() {
    }

    /** The cover is returned as an object; null in TripView means automatic. */
    public record CoverView(String kind, String ref) {
    }

    /** A choice with a code and a Vietnamese label (trip kind, pace). */
    public record Choice(String code, String label) {
    }

    public record TripView(String id, String name, String destination, String startDate, String endDate,
                           Long budgetK, String budgetFormatted, List<Choice> styles, Choice pace,
                           boolean datesTentative, Choice kind, List<Choice> interests, String createdAt, String updatedAt,
                       String role, int memberCount, String selfMemberId, CoverView cover) {
    }

    /**
     * The planned budget compared with 'Extra to pay' (R2). {@code unknownCount} = the number of visible items with an unknown price: they are NOT
     * in the total, so the 'remaining' part is only the most that could be left (D18). {@code gapK} is always non-negative; {@code over} says
     * whether it is over or remaining.
     */
    public record Budget(long budgetK, String budgetFormatted, long extraK, String extraFormatted, int unknownCount,
                         boolean over, long gapK, String gapFormatted) {
    }

    /**
     * One item. {@code day} null = 'no date yet'; {@code placeId} null = a free-form item, otherwise it is a place id in the catalog
     * (the name, photo and coordinates are joined from the catalog by the UI).
     */
    public record ItemView(String id, String tripId, String placeId, String day, int position, String type, String typeLabel,
                           String title, String timeOfDay, Integer durationMin, String note, Long costK,
                           String costFormatted, boolean included, Long referenceK, String referenceFormatted,
                           String booking, String bookingLabel, boolean done, String deletedAt, String addedBy, List<String> doneBy) {
    }

    /** One member of the trip. There is NO identity id or device name; {@code self} marks the caller. */
    public record MemberView(String id, String displayName, String role, String joinedAt, boolean self) {
    }

    /** One deletion request. {@code requesterName} is null if the requester left the trip. There is NO identity id. */
    public record DeletionRequestView(String id, String itemId, String requesterId, String requesterName, String reason, String status,
                                      String requestedAt, String decidedAt) {
    }

    /** Status of an invite link (no code). */
    public record InviteView(String id, String createdAt, String expiresAt, boolean active) {
    }

    /** A newly created link: the code is shown only this once. */
    public record CreatedInviteView(String id, String code, String expiresAt) {
    }

    /** Preview of an invite link. */
    public record InvitePreviewView(String tripName, long memberCount) {
    }

    /** A trip in 'Recently deleted trips': the trip and the time it was deleted (ISO-8601). */
    public record DeletedTrip(TripView trip, String deletedAt) {
    }

    public record DayView(String date, int index, int weekday, String weekdayLabel, List<ItemView> items) {
    }

    public record DayTotal(String date, long extraK, String extraFormatted) {
    }

    public record TypeTotal(String type, String typeLabel, long extraK, String extraFormatted) {
    }

    /**
     * The extra amount to pay (R2) for the whole trip, including 'no date yet' items (DR-006). {@code unscheduledK} is the share of the undated
     * items alone, so the sum of {@code byDay} can be smaller than {@code extraK}.
     */
    public record Totals(long extraK, String extraFormatted, long unscheduledK, String unscheduledFormatted,
                         List<DayTotal> byDay, List<TypeTotal> byType) {
    }

    /** An unfinished to-do; {@code day} is null if the to-do has no date. */
    public record PendingTask(String id, String day, String title, String timeOfDay) {
    }

    /** Trip detail. {@code unscheduled} are the visible items with no date, in manual order. */
    public record TripDetail(TripView trip, int dayCount, List<DayView> days, List<ItemView> unscheduled, Totals totals,
                             List<PendingTask> pendingTasks, int trashCount, Budget budget) {
    }

    /** A checklist item: {@code done} is the CALLER'S OWN, {@code doneBy} are the member ids of those who finished. */
    public record ChecklistItemView(String id, String group, String title, int position, boolean done, List<String> doneBy) {
    }
}
