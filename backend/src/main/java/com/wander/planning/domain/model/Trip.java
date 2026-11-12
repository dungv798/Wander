package com.wander.planning.domain.model;

import com.wander.planning.domain.constant.PlanningConstants;
import com.wander.planning.domain.constant.PlanningErrorCodes;
import com.wander.planning.domain.constant.PlanningFields;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.planning.domain.rule.ItemText;
import com.wander.planning.domain.vocabulary.ItemType;
import com.wander.planning.domain.vocabulary.MemberRole;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.util.Patch;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * The 'Trip' aggregate root. Every change to items goes through here to keep the invariants:
 * <ul>
 *   <li>The visible items in a day have a manual order by stored position, increasing (D16). Positions are renumbered gaplessly
 *       0..n-1 when adding, reordering or inserting into a day; soft-deleting and moving an item out of a day do NOT renumber, so there can be
 *       gaps (holding the place of items in the trash). The API always returns a gapless rank, see {@code PlanningQueries}.</li>
 *   <li>An item either belongs to a day inside the trip's date range, or to 'no date yet' (a null day, still with its own order).
 *       New R12 (DR-011 A1): the date range can always be changed; items (even soft-deleted ones) outside the new range go back to 'no date yet'.</li>
 *   <li>Soft delete keeps the old day and position so it can be restored to the exact place (D19, R7).</li>
 * </ul>
 * Does not depend on Spring/JPA: the infrastructure layer maps it to tables.
 */
public final class Trip {

    private static final Comparator<Item> DAY_ORDER = Comparator.comparingInt(Item::position)
            .thenComparing(Item::createdAt)
            .thenComparing(item -> item.id().toString());

    private final UUID id;
    private final UUID ownerId;
    private String name;
    private String destination;
    private DateRange range;
    /** Trip options (Q11, DR-002): budget, trip kind, pace. */
    private TripOptions options;
    /** The chosen cover; null is automatic by destination. */
    private Cover cover;
    private final Instant createdAt;
    private Instant updatedAt;
    /** The time the trip was soft-deleted (PO 28/10/2026); null = the trip is visible. A deleted trip keeps its items so it can be restored. */
    private Instant deletedAt;
    private final long version;
    private final List<Item> items;
    /** The circle of people: members (exactly one Organizer, at most MAX_MEMBERS, no duplicate names) and invite links (at most one not revoked). */
    private final TripCircle circle;

    /** Rebuilds a trip from stored data (not normalized again). */
    public Trip(UUID id, UUID ownerId, String name, String destination, DateRange range, TripOptions options,
                Instant createdAt, Instant updatedAt, Instant deletedAt, long version, List<Item> items,
                List<TripMember> members, List<TripInvite> invites, List<DeletionRequest> requests, Cover cover) {
        this.id = id;
        this.ownerId = ownerId;
        this.name = name;
        this.destination = destination;
        this.range = range;
        this.options = options;
        this.cover = cover;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.deletedAt = deletedAt;
        this.version = version;
        this.items = new ArrayList<>(items);
        this.circle = new TripCircle(members, invites, requests);
    }

    /** A-1: creates a trip with a valid name, destination and date range. */
    public static Trip plan(UUID ownerId, String name, String destination, DateRange range, Instant now) {
        return plan(ownerId, name, destination, range, TripOptions.NONE, now);
    }

    /** A-1 with the trip options (Q11). */
    public static Trip plan(UUID ownerId, String name, String destination, DateRange range, TripOptions options, Instant now) {
        UUID tripOwner = ownerId;
        TripMember organizer = new TripMember(UUID.randomUUID(), tripOwner, MemberRole.ORGANIZER, PlanningConstants.ORGANIZER_DISPLAY_NAME, now);
        return new Trip(UUID.randomUUID(), ownerId,
                ItemText.required(name, PlanningConstants.MAX_TRIP_NAME, PlanningFields.NAME),
                ItemText.required(destination, PlanningConstants.MAX_DESTINATION, PlanningFields.DESTINATION),
                range, options, now, now, null, 0, List.of(), List.of(organizer), List.of(), List.of(), null);
    }

    /** Has the trip been soft-deleted (is it in 'Recently deleted trips')? */
    public boolean isDeleted() {
        return deletedAt != null;
    }

    /** The time of soft deletion; null if the trip is visible. */
    public Instant deletedAt() {
        return deletedAt;
    }

    /** Soft-deletes the whole trip (D19): the trip leaves the list, the items stay so it can be restored. Deleting twice is a conflict. */
    public void moveToTrash(Instant now) {
        if (isDeleted()) throw WanderException.conflict(PlanningErrorCodes.ALREADY_DELETED, PlanningMessages.TRIP_DELETED);
        this.deletedAt = now;
        this.updatedAt = now;
    }

    /** Restores a trip from 'Recently deleted trips' exactly as it was; a trip that is not deleted is a conflict. */
    public void recoverFromTrash(Instant now) {
        if (!isDeleted()) throw WanderException.conflict(PlanningErrorCodes.NOT_DELETED, PlanningMessages.TRIP_NOT_DELETED);
        this.deletedAt = null;
        this.updatedAt = now;
    }

    // ---- members and invite links (Slice 1b, DR-021): the rules are in {@link TripCircle} ----

    /** The circle of people of the trip: members and invite links with their rules (create/revoke a link, join, remove, leave, rename). */
    public TripCircle circle() {
        return circle;
    }

    /** The role of an identity in the trip; empty for an outsider. */
    public Optional<MemberRole> roleOf(UUID identityId) {
        return circle.roleOf(identityId);
    }

    /** The member of this identity; an outsider => 404 (does not reveal that the trip exists, INV-6). */
    public TripMember requireMember(UUID identityId) {
        return circle.requireMember(identityId);
    }

    /** Organizer only: an outsider => 404, a regular member => 403 NOT_ORGANIZER. */
    public void requireOrganizer(UUID identityId) {
        circle.requireOrganizer(identityId);
    }

    /** Permission to edit/delete/restore an item (H3): the Organizer any item; a member only items they added (403 NOT_YOUR_ITEM); an outsider 404. */
    public void requireMayChange(UUID identityId, Item item) {
        circle.requireMayChange(identityId, item.addedByMemberId());
    }

    /** Joins the trip with a link; a soft-deleted trip accepts nobody (INVALID_INVITE). */
    public TripMember joinWithInvite(UUID identityId, String rawDisplayName, String codeHash, Instant now) {
        TripMember member = circle.joinWithInvite(identityId, rawDisplayName, codeHash, now, isDeleted());
        this.updatedAt = now;
        return member;
    }
    /** The chosen cover; null to use the destination's default photo. */
    public Cover cover() { return cover; }

    /** Changes the cover or goes back to automatic; the Organizer permission is checked first in the use case. */
    public void changeCover(Cover newCover, Instant now) {
        this.cover = newCover;
        this.updatedAt = now;
    }

    /** Q11: changes the trip options (budget, kind, pace). There is no edit history (D19). */
    public void changeOptions(TripOptions newOptions, Instant now) {
        this.options = newOptions;
        this.updatedAt = now;
    }

    /**
     * A-1 edit a trip. New R12 (DR-011 A1): the date range can always be changed; items (even soft-deleted ones) outside the new range
     * go back to 'no date yet', visible items are appended to the end of that area by old day then old position.
     */
    public void changeDetails(String newName, String newDestination, DateRange newRange, Instant now) {
        String checkedName = ItemText.required(newName, PlanningConstants.MAX_TRIP_NAME, PlanningFields.NAME);
        String checkedDestination = ItemText.required(newDestination, PlanningConstants.MAX_DESTINATION, PlanningFields.DESTINATION);
        this.name = checkedName;
        this.destination = checkedDestination;
        if (!newRange.equals(range)) {
            this.range = newRange;
            detachItemsOutsideRange();
        }
        this.updatedAt = now;
    }

    /** The day must be inside the trip's date range; otherwise DAY_OUT_OF_RANGE is reported on the {@code day} field. */
    public void requireDayInRange(LocalDate day) {
        if (!range.contains(day)) {
            throw WanderException.invalid(PlanningErrorCodes.DAY_OUT_OF_RANGE, PlanningMessages.DAY_OUT_OF_RANGE, PlanningFields.DAY);
        }
    }

    /** A-3: adds an item to the chosen day (null = 'no date yet'), by default at the end of the day or at the requested position. */
    public Item addItem(LocalDate day, ItemDetails details, Integer requestedPosition, Instant now) {
        return addItem(day, details, requestedPosition, null, now);
    }

    /** Like {@link #addItem(LocalDate, ItemDetails, Integer, Instant)} and records the member who added it (null = Organizer). */
    public Item addItem(LocalDate day, ItemDetails details, Integer requestedPosition, UUID addedByMemberId, Instant now) {
        if (day != null) requireDayInRange(day);
        Item item = Item.create(day, details, addedByMemberId, now);
        List<Item> live = liveItems(day);
        items.add(item);
        renumber(insertAt(live, item, requestedPosition == null ? live.size() : requestedPosition));
        return item;
    }

    /** The item exists and has not been deleted (so it can be edited). */
    public Item editableItem(UUID itemId) {
        Item item = item(itemId);
        if (item.isDeleted()) {
            throw WanderException.conflict(PlanningErrorCodes.ITEM_DELETED, PlanningMessages.ITEM_DELETED_EDIT);
        }
        return item;
    }

    /**
     * A-7: edits an item. {@code newDay} distinguishes three cases: not given => keep the day; given null => back to 'no date yet'; given a date =>
     * move to that day. When the day changes it is removed from the old day and inserted into the new day (by default at the end).
     */
    public Item editItem(UUID itemId, ItemDetails details, Patch<LocalDate> newDay, Integer requestedPosition, Instant now) {
        Item item = editableItem(itemId);
        if (newDay.isPresent() && newDay.value() != null) requireDayInRange(newDay.value());
        item.apply(details, now);
        if (newDay.isPresent() && !Objects.equals(newDay.value(), item.day())) {
            moveToDay(item, newDay.value(), requestedPosition);
        }
        return item;
    }

    /** A-5: the new order must be exactly a permutation of the items visible in the day. Changing a time does not reorder by itself. */
    public List<Item> reorderDay(LocalDate day, List<UUID> orderedIds) {
        requireDayInRange(day);
        List<Item> current = liveItems(day);
        Set<UUID> currentIds = new HashSet<>(current.stream().map(Item::id).toList());
        Set<UUID> requested = new HashSet<>(orderedIds);
        boolean exactPermutation = orderedIds.size() == current.size() && requested.size() == orderedIds.size()
                && currentIds.equals(requested);
        if (!exactPermutation) {
            throw WanderException.invalid(PlanningErrorCodes.INVALID_ORDER, PlanningMessages.ORDER_MISMATCH, PlanningFields.ORDERED_IDS);
        }
        List<Item> reordered = orderedIds.stream().map(this::item).toList();
        renumber(reordered);
        return reordered;
    }

    /**
     * Bulk date assignment, atomic: the WHOLE list is validated first (the item exists and is not deleted, no duplicates, the day is within the
     * trip), and only then applied in list order. An element for the item's current day with no position stays as it is;
     * with a position it is rearranged there. Sending back the old state (by increasing position) is how Undo works.
     */
    public void assignDays(List<DayAssignment> assignments, Instant now) {
        requireValidAssignments(assignments);
        for (DayAssignment assignment : assignments) {
            Item item = item(assignment.itemId());
            boolean unchanged = Objects.equals(item.day(), assignment.day()) && assignment.position() == null;
            if (unchanged) continue;
            moveToDay(item, assignment.day(), assignment.position());
            item.touch(now);
        }
        this.updatedAt = now;
    }

    /**
     * D19/R7: soft delete. The item leaves the schedule and the totals, keeping its old day and position. The visible items are NOT renumbered: the place of the
     * deleted item is kept (the position has a gap) so that restoring in any order still goes back to the exact old place.
     */
    public Item softDelete(UUID itemId, Instant now) {
        Item item = item(itemId);
        if (item.isDeleted()) throw WanderException.conflict(PlanningErrorCodes.ALREADY_DELETED, PlanningMessages.ITEM_DELETED);
        if (items.stream().filter(Item::isDeleted).count() >= PlanningConstants.MAX_TRASH_ITEMS) {
            throw WanderException.conflict(PlanningErrorCodes.TRASH_FULL, PlanningMessages.TRASH_FULL);
        }
        item.markDeleted(now);
        circle.settlePendingOf(itemId, now);
        return item;
    }

    /**
     * Undo and 'restore from Recently deleted' are the same operation: back to the exact old day and place. The item keeps its stored position
     * (other items are not renumbered, so items still in the trash stay comparable). Only when that position has been taken by another item
     * (after a reorder) is it inserted before the items from that position on and the positions renumbered gaplessly.
     */
    public Item restore(UUID itemId, Instant now) {
        Item item = item(itemId);
        if (!item.isDeleted()) throw WanderException.conflict(PlanningErrorCodes.NOT_DELETED, PlanningMessages.NOT_DELETED);
        List<Item> live = liveItems(item.day());
        boolean positionTaken = live.stream().anyMatch(other -> other.position() == item.position());
        item.markRestored(now);
        if (positionTaken) {
            int slot = (int) live.stream().filter(other -> other.position() < item.position()).count();
            renumber(insertAt(live, item, slot));
        }
        return item;
    }

    /** Permanent deletion applies only to an item that is already in 'Recently deleted' (the default for Q17c). */
    public void purge(UUID itemId) {
        Item item = item(itemId);
        if (!item.isDeleted()) {
            throw WanderException.conflict(PlanningErrorCodes.NOT_IN_TRASH, PlanningMessages.NOT_IN_TRASH);
        }
        items.remove(item);
        circle.forgetItem(itemId);
    }

    /** A-10/DR-029: ticks a to-do or 'Visited' on an item that has a place; stored per person, a deleted item cannot be ticked. */
    public Item setTaskDone(UUID itemId, UUID personId, Boolean done, Instant now) {
        Item item = item(itemId);
        if (item.isDeleted()) throw WanderException.conflict(PlanningErrorCodes.ITEM_DELETED, PlanningMessages.ITEM_DELETED);
        if (item.type() != ItemType.TASK && (item.placeId() == null || item.type() == ItemType.REST)) {
            throw WanderException.invalid(PlanningErrorCodes.NOT_A_TASK, PlanningMessages.NOT_A_TASK, PlanningFields.TYPE);
        }
        if (done == null) throw WanderException.invalidValue(ErrorCodes.MALFORMED, PlanningFields.DONE);
        item.setDone(personId, done, now);
        return item;
    }

    /** An item by id (including soft-deleted); 404 if it does not exist. */
    public Item item(UUID itemId) {
        return items.stream().filter(item -> item.id().equals(itemId)).findFirst().orElseThrow(WanderException::notFound);
    }

    /** The visible items in a day (null = the 'no date yet' area), in manual order. */
    public List<Item> liveItems(LocalDate day) {
        return items.stream().filter(item -> !item.isDeleted() && Objects.equals(item.day(), day)).sorted(DAY_ORDER).toList();
    }

    /** Each element must point to an item that exists and is not deleted, no duplicate items, and the day (if any) is within the trip. */
    private void requireValidAssignments(List<DayAssignment> assignments) {
        Set<UUID> seen = new HashSet<>();
        for (DayAssignment assignment : assignments) {
            editableItem(assignment.itemId());
            if (!seen.add(assignment.itemId())) {
                throw WanderException.invalid(PlanningErrorCodes.DUPLICATE_ASSIGNMENT, PlanningMessages.ASSIGNMENT_DUPLICATED,
                        PlanningFields.ASSIGNMENTS);
            }
            if (assignment.day() != null) requireDayInRange(assignment.day());
        }
    }

    /**
     * Moves the item to day {@code day} (null = 'no date yet'): inserts it into the new area (by default at the end) and renumbers the new area.
     * The old area is NOT renumbered (the gap is left) so as not to lose the place of an item that is in 'Recently deleted'.
     */
    private void moveToDay(Item item, LocalDate day, Integer requestedPosition) {
        List<Item> target = liveItems(day);
        item.moveTo(day);
        renumber(insertAt(target, item, requestedPosition == null ? target.size() : requestedPosition));
    }

    /**
     * New R12: every item (even soft-deleted ones) with a day outside the current range goes back to 'no date yet'. Visible items are appended to the end of
     * that area by old day then old position; deleted items keep their old position so they can be restored to the exact place.
     */
    private void detachItemsOutsideRange() {
        Set<LocalDate> outsideDays = new HashSet<>(range.outside(items.stream().map(Item::day).filter(Objects::nonNull).toList()));
        if (outsideDays.isEmpty()) return;
        List<Item> detached = items.stream().filter(item -> outsideDays.contains(item.day()))
                .sorted(Comparator.comparing(Item::day).thenComparing(DAY_ORDER)).toList();
        List<Item> unscheduledLive = new ArrayList<>(liveItems(null));
        for (Item item : detached) {
            item.moveTo(null);
            if (!item.isDeleted()) unscheduledLive.add(item);
        }
        renumber(unscheduledLive);
    }

    /** The new list after placing {@code item} at {@code index} (clamped to [0, size]), dropping the item's old copy if present. */
    private static List<Item> insertAt(List<Item> live, Item item, int index) {
        List<Item> ordered = new ArrayList<>(live);
        ordered.remove(item);
        int clamped = Math.max(0, Math.min(index, ordered.size()));
        ordered.add(clamped, item);
        return ordered;
    }

    /** Renumbers the positions gaplessly 0..n-1 in list order. */
    private static void renumber(List<Item> ordered) {
        for (int position = 0; position < ordered.size(); position++) ordered.get(position).setPosition(position);
    }

    /** Trip id. */
    public UUID id() { return id; }
    /** Identity id of the trip owner. */
    public UUID ownerId() { return ownerId; }
    /** Trip name. */
    public String name() { return name; }
    /** Destination. */
    public String destination() { return destination; }
    /** Date range. */
    public DateRange range() { return range; }
    /** Trip options. */
    public TripOptions options() { return options; }
    /** Creation time. */
    public Instant createdAt() { return createdAt; }
    /** Time of the last edit. */
    public Instant updatedAt() { return updatedAt; }
    /** Version of the aggregate (optimistic lock). */
    public long version() { return version; }
    /** Every item, including soft-deleted ones (not editable). */
    public List<Item> items() { return Collections.unmodifiableList(items); }
}
