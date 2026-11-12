package com.wander.planning.application.command;

import com.wander.planning.application.input.AssignmentInput;
import com.wander.planning.application.input.CoverInput;
import com.wander.shared.kernel.util.FlexibleNumber;
import com.wander.shared.kernel.util.Patch;
import java.util.List;
import java.util.UUID;

/**
 * Commands of the write side (CQRS). Each command is one intent to change something and returns an id; what to display is read back
 * through {@code PlanningQueries}.
 * <p>
 * Request values arrive typed but unvalidated: the input rules (D17 amounts, dates, codes) are applied inside the handler, after the
 * aggregate has been loaded, so that errors appear in the order the API contract documents (for example a deleted item is reported as
 * ITEM_DELETED before any field error). Partial updates carry {@link Patch} values: not sent, sent as null, or sent with a value.
 */
public final class PlanningCommands {

    private PlanningCommands() {
    }

    /** Soft-delete a whole trip. */
    public record DeleteTrip(UUID ownerId, UUID tripId) {
    }

    /** Restore a soft-deleted trip. */
    public record RestoreTrip(UUID ownerId, UUID tripId) {
    }

    /** Create a trip; every value is optional except name, destination and the two dates (checked by the handler). */
    public record CreateTrip(UUID ownerId, String name, String destination, String startDate, String endDate, FlexibleNumber budget,
                             List<String> styles, String pace, Boolean datesTentative, String kind, List<String> interests) {
    }

    /** Change trip details and options; a field that was not sent is left as it is. */
    public record UpdateTrip(UUID ownerId, UUID tripId, Patch<String> name, Patch<String> destination, Patch<String> startDate,
                             Patch<String> endDate, Patch<FlexibleNumber> budget, Patch<List<String>> styles, Patch<String> pace,
                             Patch<Boolean> datesTentative, Patch<String> kind, Patch<List<String>> interests, Patch<CoverInput> cover) {
    }

    /**
     * The values of an item as sent when adding or editing one. When adding, a field that was not sent takes its default; when editing,
     * it keeps the current value (null is a value for {@code day}, {@code note}, {@code booking} and the cost fields).
     */
    public record ItemFields(Patch<String> type, Patch<String> title, Patch<String> day, Patch<String> timeOfDay,
                             Patch<FlexibleNumber> durationMin, Patch<String> note, Patch<FlexibleNumber> cost, Patch<Boolean> included,
                             Patch<FlexibleNumber> referenceCost, Patch<String> booking, Patch<String> placeId,
                             Patch<FlexibleNumber> position) {
    }

    /** Add an item to a trip. */
    public record AddItem(UUID ownerId, UUID tripId, ItemFields fields) {
    }

    /** Edit an item that has not been deleted. */
    public record EditItem(UUID ownerId, UUID tripId, UUID itemId, ItemFields fields) {
    }

    /** Put the items of one day in a new order. */
    public record ReorderDay(UUID ownerId, UUID tripId, String day, List<String> orderedIds) {
    }

    /** Soft-delete an item. */
    public record SoftDeleteItem(UUID ownerId, UUID tripId, UUID itemId) {
    }

    /** Restore a soft-deleted item. */
    public record RestoreItem(UUID ownerId, UUID tripId, UUID itemId) {
    }

    /** Permanently delete an item that is in "recently deleted". */
    public record PurgeItem(UUID ownerId, UUID tripId, UUID itemId) {
    }

    /** Tick or untick a task (or "visited" on a place) for the calling member. */
    public record SetTaskDone(UUID ownerId, UUID tripId, UUID itemId, Boolean done) {
    }

    /** Replace the interests of an identity; they must be sent ({@code interests} missing is REQUIRED), null or empty clears them. */
    public record SetInterestPreferences(UUID ownerId, Patch<List<String>> interests) {
    }

    /**
     * The "schedule" command: optionally change the trip's date range (sending only one end keeps the other) and assign items to days
     * in bulk, all in one transaction and one version bump. Sending back the old state is how Undo works.
     */
    public record ApplySchedule(UUID ownerId, UUID tripId, Patch<String> startDate, Patch<String> endDate,
                                Patch<List<AssignmentInput>> assignments) {
    }
}
