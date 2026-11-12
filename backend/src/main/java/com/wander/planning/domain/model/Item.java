package com.wander.planning.domain.model;

import com.wander.planning.domain.constant.PlanningConstants;
import com.wander.planning.domain.constant.PlanningErrorCodes;
import com.wander.planning.domain.constant.PlanningFields;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.planning.domain.vocabulary.BookingStatus;
import com.wander.planning.domain.vocabulary.ItemType;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.error.WanderException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * An item in the schedule (D13, D16; R6). An entity inside the {@link Trip} aggregate: only Trip may change the day/position
 * so the in-day order invariant holds. Time and duration are optional; the order is manual.
 */
public final class Item {

    private final UUID id;
    /** The item's day; null = 'no date yet' (DR-011 A1). An undated item still has its own order inside that area. */
    private LocalDate day;
    private int position;
    private ItemType type;
    private String title;
    private LocalTime timeOfDay;
    private Integer durationMin;
    private String note;
    private ItemCost cost;
    /** Booking status (A-14); null only when the item type has no booking (Rest, To-do). */
    private BookingStatus booking;
    /** Id of the place in the editorial catalog that the item links to; null = a free-form item. */
    private String placeId;
    private Instant deletedAt;
    private final Instant createdAt;
    private Instant updatedAt;
    /** Completion/Visited as (item x identity) pairs, shared by to-dos and places (DR-029). */
    private final Map<UUID, Instant> completions;
    /** The MEMBER id who added the item (null = Organizer/old data); used for the permission to edit/delete one's own item (H3). */
    private final UUID addedByMemberId;

    /** Rebuilt from stored data (not normalized again: the database has the matching CHECK constraints). */
    public Item(UUID id, LocalDate day, int position, ItemType type, String title, LocalTime timeOfDay,
                Integer durationMin, String note, ItemCost cost, BookingStatus booking, String placeId, Instant deletedAt,
                Instant createdAt, Instant updatedAt, Map<UUID, Instant> completions, UUID addedByMemberId) {
        this.id = id;
        this.day = day;
        this.position = position;
        this.type = type;
        this.title = title;
        this.timeOfDay = timeOfDay;
        this.durationMin = durationMin;
        this.note = note;
        this.cost = cost;
        this.booking = booking;
        this.placeId = placeId;
        this.deletedAt = deletedAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.completions = new LinkedHashMap<>(completions);
        this.addedByMemberId = addedByMemberId;
    }

    /** The id of the member who added the item; null if the Organizer added it or it is old data. */
    public UUID addedByMemberId() {
        return addedByMemberId;
    }

    /** Creates a new item at position 0 of day {@code day} (null = no date yet) from validated fields; Trip renumbers the positions. */
    static Item create(LocalDate day, ItemDetails details, UUID addedByMemberId, Instant now) {
        return new Item(UUID.randomUUID(), day, 0, details.type(), details.title(), details.timeOfDay(),
                checkDuration(details.durationMin()), details.note(), details.cost(),
                bookingFor(details.type(), details.booking()), details.placeId(), null, now, now, Map.of(), addedByMemberId);
    }

    /**
     * Booking-status rule (A-14): a type that has booking always has a status (not given => 'Awaiting confirmation');
     * Rest and To-do have none, and accept no value.
     */
    static BookingStatus bookingFor(ItemType type, BookingStatus requested) {
        if (!type.supportsBooking()) {
            if (requested != null) {
                throw WanderException.invalid(PlanningErrorCodes.BOOKING_NOT_APPLICABLE, PlanningMessages.BOOKING_NOT_APPLICABLE,
                        PlanningFields.BOOKING);
            }
            return null;
        }
        return requested == null ? BookingStatus.PENDING : requested;
    }

    /** The duration (if any) must be in [0, maximum]; otherwise OUT_OF_RANGE is reported. */
    static Integer checkDuration(Integer minutes) {
        if (minutes != null && (minutes < 0 || minutes > PlanningConstants.MAX_DURATION_MIN)) {
            throw WanderException.invalidValue(ErrorCodes.OUT_OF_RANGE, PlanningFields.DURATION_MIN);
        }
        return minutes;
    }

    /** Applies the item's new fields (no change of day or position). */
    void apply(ItemDetails details, Instant now) {
        this.type = details.type();
        this.title = details.title();
        this.timeOfDay = details.timeOfDay();
        this.durationMin = checkDuration(details.durationMin());
        this.note = details.note();
        this.cost = details.cost();
        this.booking = bookingFor(details.type(), details.booking());
        this.placeId = details.placeId();
        this.updatedAt = now;
    }

    /** Records that the item has just been rearranged (day or position changed) at time {@code now}. */
    void touch(Instant now) {
        this.updatedAt = now;
    }

    /** Moves the item to another day, or back to 'no date yet' if {@code newDay} is null (Trip renumbers the position). */
    void moveTo(LocalDate newDay) {
        this.day = newDay;
    }

    /** Sets the position within the day. */
    void setPosition(int position) {
        this.position = position;
    }

    /** Marks it soft-deleted at time {@code now}; the day and position are kept. */
    void markDeleted(Instant now) {
        this.deletedAt = now;
        this.updatedAt = now;
    }

    /** Clears the soft-delete mark (restore). */
    void markRestored(Instant now) {
        this.deletedAt = null;
        this.updatedAt = now;
    }

    /** Sets or clears one person's completion state. */
    void setDone(UUID personId, boolean done, Instant now) {
        if (done) completions.put(personId, now);
        else completions.remove(personId);
    }

    /** The fields a user can edit on an item. */
    public ItemDetails details() {
        return new ItemDetails(type, title, timeOfDay, durationMin, note, cost, booking, placeId);
    }

    /** The item has been soft-deleted. */
    public boolean isDeleted() {
        return deletedAt != null;
    }

    /** Whether this person has finished the to-do or visited the place item. */
    public boolean isDoneBy(UUID personId) {
        return completions.containsKey(personId);
    }

    /** The cost counted into the total (R2): a deleted item is not counted. */
    public long countedK() {
        return isDeleted() ? 0 : cost.countedK();
    }

    /** Item id. */
    public UUID id() { return id; }

    /** The item's day, or null if it has no date. */
    public LocalDate day() { return day; }

    /** Id of the catalog place the item links to, or null if it is a free-form item. */
    public String placeId() { return placeId; }

    /** Position within the day, starting from 0. */
    public int position() { return position; }

    /** Item type. */
    public ItemType type() { return type; }

    /** Title. */
    public String title() { return title; }

    /** Time of day, or null. */
    public LocalTime timeOfDay() { return timeOfDay; }

    /** Duration, in minutes, or null. */
    public Integer durationMin() { return durationMin; }

    /** Note, or null. */
    public String note() { return note; }

    /** Cost. */
    public ItemCost cost() { return cost; }

    /** Booking status, or null if the item type has none. */
    public BookingStatus booking() { return booking; }

    /** Time of soft deletion, or null if not deleted. */
    public Instant deletedAt() { return deletedAt; }

    /** Creation time. */
    public Instant createdAt() { return createdAt; }

    /** Time of the last edit. */
    public Instant updatedAt() { return updatedAt; }

    /** Completion by person (not editable). */
    public Map<UUID, Instant> completions() { return Collections.unmodifiableMap(completions); }
}
