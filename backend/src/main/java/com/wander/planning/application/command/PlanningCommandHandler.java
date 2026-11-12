package com.wander.planning.application.command;

import com.wander.planning.application.input.PlanningInput;
import com.wander.planning.domain.constant.PlanningConstants;
import com.wander.planning.domain.constant.PlanningErrorCodes;
import com.wander.planning.domain.constant.PlanningFields;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.planning.domain.model.DateRange;
import com.wander.planning.domain.model.DayAssignment;
import com.wander.planning.domain.model.Item;
import com.wander.planning.domain.model.ItemCost;
import com.wander.planning.domain.model.ItemDetails;
import com.wander.planning.domain.model.Trip;
import com.wander.planning.domain.model.TripOptions;
import com.wander.planning.domain.port.PreferencesStore;
import com.wander.planning.domain.port.TripRepository;
import com.wander.planning.domain.rule.Interests;
import com.wander.planning.domain.rule.TripNaming;
import com.wander.planning.domain.vocabulary.BookingStatus;
import com.wander.planning.domain.vocabulary.ItemType;
import com.wander.planning.domain.vocabulary.TripInterest;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.util.Ids;
import com.wander.shared.kernel.util.Patch;
import com.wander.shared.kernel.util.Timestamps;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handles the commands of the Planning bounded context. Each method = one transaction:
 * load the aggregate -> call the domain behavior -> save. Contains no business rules; the rules live in {@link Trip}.
 */
@Service
@Transactional
public class PlanningCommandHandler {

    private final TripRepository trips;
    private final PreferencesStore preferences;
    private final Clock clock;

    /** Takes the trip storage port, the preferences-by-identity storage port and the clock (tests replace it with a fake). */
    public PlanningCommandHandler(TripRepository trips, PreferencesStore preferences, Clock clock) {
        this.trips = trips;
        this.preferences = preferences;
        this.clock = clock;
    }

    /**
     * Replaces all preferences by identity (BE-10). The {@code interests} key must be present (missing => REQUIRED); null or empty = clear;
     * an unknown code or a wrong type => INVALID_INTEREST and nothing changes.
     */
    public void setInterestPreferences(PlanningCommands.SetInterestPreferences command) {
        if (!command.interests().isPresent()) {
            throw WanderException.invalid(ErrorCodes.REQUIRED, PlanningMessages.FIELD_REQUIRED, PlanningFields.INTERESTS);
        }
        List<TripInterest> interests = Interests.normalize(PlanningInput.interests(command.interests().value()));
        preferences.saveInterests(command.ownerId(), interests, Timestamps.now(clock));
    }

    /** Creates a new trip for the owner; returns the trip id. */
    public UUID createTrip(PlanningCommands.CreateTrip command) {
        String requestedName = PlanningInput.requiredText(command.name(), PlanningConstants.MAX_TRIP_NAME, PlanningFields.NAME);
        String destination = PlanningInput.requiredText(command.destination(), PlanningConstants.MAX_DESTINATION,
                PlanningFields.DESTINATION);
        String name = uniqueTripName(command.ownerId(), null, requestedName);
        DateRange range = range(command.startDate(), command.endDate());
        TripOptions options = new TripOptions(PlanningInput.budget(command.budget()),
                PlanningInput.styles(command.styles()), PlanningInput.pace(command.pace()),
                PlanningInput.datesTentative(command.datesTentative()), PlanningInput.kind(command.kind()),
                PlanningInput.interests(command.interests()));
        Trip trip = Trip.plan(command.ownerId(), name, destination, range, options, Timestamps.now(clock));
        trips.save(trip);
        return trip.id();
    }

    /** Edits the name, destination, date range and options of a trip; a field that is not given stays unchanged. */
    public void updateTrip(PlanningCommands.UpdateTrip command) {
        Trip trip = load(command.ownerId(), command.tripId());
        trip.requireOrganizer(command.ownerId());
        String name = valueOrCurrent(command.name(),
                value -> uniqueTripName(command.ownerId(), trip.id(),
                        PlanningInput.requiredText(value, PlanningConstants.MAX_TRIP_NAME, PlanningFields.NAME)), trip.name());
        String destination = valueOrCurrent(command.destination(),
                value -> PlanningInput.requiredText(value, PlanningConstants.MAX_DESTINATION, PlanningFields.DESTINATION), trip.destination());
        DateRange range = rangeFromInput(command.startDate(), command.endDate(), trip);
        // Trip options (Q11): not given => unchanged; given as null or an empty string => cleared (not set).
        TripOptions current = trip.options();
        TripOptions options = new TripOptions(
                valueOrCurrent(command.budget(), PlanningInput::budget, current.budgetK()),
                valueOrCurrent(command.styles(), PlanningInput::styles, current.styles()),
                valueOrCurrent(command.pace(), PlanningInput::pace, current.pace()),
                valueOrCurrent(command.datesTentative(), PlanningInput::datesTentative, current.datesTentative()),
                valueOrCurrent(command.kind(), PlanningInput::kind, current.kind()),
                valueOrCurrent(command.interests(), PlanningInput::interests, current.interests()));
        Instant now = Timestamps.now(clock);
        trip.changeDetails(name, destination, range, now);
        trip.changeOptions(options, now);
        if (command.cover().isPresent()) trip.changeCover(PlanningInput.cover(command.cover().value()), now);
        trips.save(trip);
    }

    /**
     * The 'schedule' command: optionally change the date range (if only one end is given the other stays) then assign dates in bulk, all in one
     * transaction and one version increment; an error at any step changes nothing. Sending back the date range and each item's old date
     * is how a change of trip dates or one scheduling action is undone.
     */
    public void applySchedule(PlanningCommands.ApplySchedule command) {
        Trip trip = load(command.ownerId(), command.tripId());
        trip.requireOrganizer(command.ownerId());
        boolean changesRange = command.startDate().isPresent() || command.endDate().isPresent();
        boolean hasAssignments = command.assignments().isPresent();
        if (!changesRange && !hasAssignments) {
            throw WanderException.invalid(ErrorCodes.REQUIRED, PlanningMessages.FIELD_REQUIRED, PlanningFields.ASSIGNMENTS);
        }
        List<DayAssignment> assignments = hasAssignments ? PlanningInput.assignments(command.assignments().value()) : List.of();
        Instant now = Timestamps.now(clock);
        if (changesRange) trip.changeDetails(trip.name(), trip.destination(), rangeFromInput(command.startDate(), command.endDate(), trip), now);
        trip.assignDays(assignments, now);
        trips.save(trip);
    }

    /**
     * Adds an item to a day of the trip (by default at the end of the day); no day, or a null day => 'no date yet' (DR-011 A1).
     * Returns the item id.
     */
    public UUID addItem(PlanningCommands.AddItem command) {
        Trip trip = load(command.ownerId(), command.tripId());
        UUID addedBy = trip.requireMember(command.ownerId()).id();
        PlanningCommands.ItemFields fields = command.fields();
        LocalDate day = PlanningInput.dayOrNull(fields.day().orElse(null));
        if (day != null) trip.requireDayInRange(day);
        ItemDetails details = new ItemDetails(PlanningInput.type(fields.type().orElse(null)), PlanningInput.title(fields.title().orElse(null)),
                PlanningInput.timeOfDay(fields.timeOfDay().orElse(null)), PlanningInput.durationMin(fields.durationMin().orElse(null)),
                PlanningInput.note(fields.note().orElse(null)), cost(fields, ItemCost.UNKNOWN),
                PlanningInput.booking(fields.booking().orElse(null)), PlanningInput.placeId(fields.placeId().orElse(null)));
        Item item = trip.addItem(day, details, PlanningInput.position(fields.position().orElse(null)), addedBy, Timestamps.now(clock));
        trips.save(trip);
        return item.id();
    }

    /** Edits an item that is not deleted; a field that is not given stays unchanged; the date and position can change. */
    public void editItem(PlanningCommands.EditItem command) {
        Trip trip = load(command.ownerId(), command.tripId());
        trip.requireMayChange(command.ownerId(), trip.item(command.itemId()));
        ItemDetails current = trip.editableItem(command.itemId()).details();
        PlanningCommands.ItemFields fields = command.fields();
        // The order of the checks is fixed by the API contract: type, title, time, duration, note, cost, booking, day.
        ItemType type = valueOrCurrent(fields.type(), PlanningInput::type, current.type());
        String title = valueOrCurrent(fields.title(), PlanningInput::title, current.title());
        LocalTime timeOfDay = valueOrCurrent(fields.timeOfDay(), PlanningInput::timeOfDay, current.timeOfDay());
        Integer durationMin = valueOrCurrent(fields.durationMin(), PlanningInput::durationMin, current.durationMin());
        String note = valueOrCurrent(fields.note(), PlanningInput::note, current.note());
        ItemCost cost = cost(fields, current.cost());
        // No booking status given => unchanged; changing to a type with no booking (Rest, To-do) => the status is cleared automatically.
        BookingStatus booking = fields.booking().isPresent() ? PlanningInput.booking(fields.booking().value())
                : (type.supportsBooking() ? current.booking() : null);
        String placeId = valueOrCurrent(fields.placeId(), PlanningInput::placeId, current.placeId());
        ItemDetails details = new ItemDetails(type, title, timeOfDay, durationMin, note, cost, booking, placeId);
        // Day: not given => unchanged; given as null => back to 'no date yet'; given a date => moves to that day.
        Patch<LocalDate> newDay = fields.day().map(PlanningInput::dayOrNull);
        trip.editItem(command.itemId(), details, newDay, PlanningInput.position(fields.position().orElse(null)), Timestamps.now(clock));
        trips.save(trip);
    }

    /** Reorders the items currently shown in a day into the new order; returns the reordered day. */
    public LocalDate reorderDay(PlanningCommands.ReorderDay command) {
        Trip trip = load(command.ownerId(), command.tripId());
        trip.requireOrganizer(command.ownerId());
        LocalDate day = PlanningInput.day(command.day());
        trip.requireDayInRange(day);
        trip.reorderDay(day, parseOrderedIds(command.orderedIds()));
        trips.save(trip);
        return day;
    }

    /** Soft-deletes an item (into 'Recently deleted'). */
    public void softDeleteItem(PlanningCommands.SoftDeleteItem command) {
        Trip trip = load(command.ownerId(), command.tripId());
        trip.requireMayChange(command.ownerId(), trip.item(command.itemId()));
        trip.softDelete(command.itemId(), Timestamps.now(clock));
        trips.save(trip);
    }

    /** Restores a soft-deleted item to its exact old day and position. */
    public void restoreItem(PlanningCommands.RestoreItem command) {
        Trip trip = load(command.ownerId(), command.tripId());
        trip.requireMayChange(command.ownerId(), trip.item(command.itemId()));
        trip.restore(command.itemId(), Timestamps.now(clock));
        trips.save(trip);
    }

    /** Permanently deletes an item that is already in 'Recently deleted'. */
    public void purgeItem(PlanningCommands.PurgeItem command) {
        Trip trip = load(command.ownerId(), command.tripId());
        trip.requireOrganizer(command.ownerId());
        trip.purge(command.itemId());
        trips.save(trip);
    }

    /** Ticks/unticks a to-do or 'Visited' for the calling member themself, regardless of who added the item. */
    public void setTaskDone(PlanningCommands.SetTaskDone command) {
        Trip trip = load(command.ownerId(), command.tripId());
        trip.requireMember(command.ownerId());
        trip.setTaskDone(command.itemId(), command.ownerId(), command.done(), Timestamps.now(clock));
        trips.save(trip);
    }

    // ---- helpers ----

    /** Soft-deletes a whole trip (PO 28/10/2026): the trip leaves the list, the items stay so it can be restored. */
    public void deleteTrip(PlanningCommands.DeleteTrip command) {
        Trip trip = load(command.ownerId(), command.tripId());
        trip.requireOrganizer(command.ownerId());
        trip.moveToTrash(Timestamps.now(clock));
        trips.save(trip);
    }

    /** Restores a trip from 'Recently deleted trips'. */
    public void restoreTrip(PlanningCommands.RestoreTrip command) {
        Trip trip = trips.findOwnedDeleted(command.tripId(), command.ownerId()).orElseThrow(WanderException::notFound);
        trip.recoverFromTrash(Timestamps.now(clock));
        trips.save(trip);
    }

    /** Loads a trip of which the caller is a member (any role); an outsider and a deleted trip count as absent (404). Role permissions are checked in each command. */
    private Trip load(UUID actorId, UUID tripId) {
        return trips.findAccessible(tripId, actorId).orElseThrow(WanderException::notFound);
    }

    /**
     * A name that does not clash with another trip's name of the same owner (DR-006): on a clash a suffix ' - 2', ' - 3'... is added. The trip {@code exceptTripId}
     * (the trip being renamed, null when creating) does not count as a clash.
     */
    private String uniqueTripName(UUID ownerId, UUID exceptTripId, String requestedName) {
        Map<UUID, String> names = new HashMap<>(trips.tripNamesOf(ownerId));
        names.remove(exceptTripId);
        return TripNaming.uniqueName(new HashSet<>(names.values()), requestedName);
    }

    /** The date range from the input: an end that is not given is taken from the current trip. */
    private static DateRange rangeFromInput(Patch<String> startDate, Patch<String> endDate, Trip trip) {
        return range(startDate.orElse(trip.range().start().toString()), endDate.orElse(trip.range().end().toString()));
    }

    /** The validated value of a field if it is given in the input, otherwise the current value is kept. */
    private static <A, T> T valueOrCurrent(Patch<A> sent, Function<A, T> parse, T current) {
        return sent.isPresent() ? parse.apply(sent.value()) : current;
    }

    /** The list of item ids in the new order from the raw input; if it is not a list of valid id strings, an order error is reported. */
    private static List<UUID> parseOrderedIds(List<String> list) {
        if (list == null || list.stream().anyMatch(java.util.Objects::isNull)) {
            throw WanderException.invalid(ErrorCodes.MALFORMED, PlanningMessages.ORDER_MALFORMED, PlanningFields.ORDERED_IDS);
        }
        List<UUID> ids = new ArrayList<>();
        for (String element : list) {
            ids.add(Ids.parse(element).orElseThrow(() -> WanderException.invalid(
                    PlanningErrorCodes.INVALID_ORDER, PlanningMessages.ORDER_MISMATCH, PlanningFields.ORDERED_IDS)));
        }
        return ids;
    }

    /** The date range in the error order of the API contract: START_REQUIRED, END_REQUIRED, INVALID_DATE, END_BEFORE_START, TOO_LONG. */
    static DateRange range(String start, String end) {
        if (PlanningInput.isMissing(start)) {
            throw WanderException.invalid(PlanningErrorCodes.START_REQUIRED, PlanningMessages.TRIP_RANGE_INVALID, PlanningFields.START_DATE);
        }
        if (PlanningInput.isMissing(end)) {
            throw WanderException.invalid(PlanningErrorCodes.END_REQUIRED, PlanningMessages.TRIP_RANGE_INVALID, PlanningFields.END_DATE);
        }
        LocalDate startDate = PlanningInput.isoDateOrNull(start);
        LocalDate endDate = PlanningInput.isoDateOrNull(end);
        if (startDate == null || endDate == null) {
            throw WanderException.invalid(PlanningErrorCodes.INVALID_DATE, PlanningMessages.TRIP_RANGE_INVALID, PlanningFields.END_DATE);
        }
        return DateRange.of(startDate, endDate);
    }

    /**
     * The three cost fields in validation order: 'included' (a boolean), cost, reference price,
     * then the rule that a reference price is valid only when ticked (in {@link ItemCost}).
     */
    static ItemCost cost(PlanningCommands.ItemFields fields, ItemCost current) {
        boolean included = fields.included().isPresent()
                ? PlanningInput.bool(fields.included().value(), PlanningFields.INCLUDED) : current.included();
        Long costK = fields.cost().isPresent()
                ? PlanningInput.amountK(fields.cost().value(), PlanningFields.COST) : current.costK();
        boolean referenceSent = fields.referenceCost().isPresent();
        Long reference = referenceSent ? PlanningInput.amountK(fields.referenceCost().value(), PlanningFields.REFERENCE_COST) : null;
        return current.change(costK, included, referenceSent, reference);
    }
}
