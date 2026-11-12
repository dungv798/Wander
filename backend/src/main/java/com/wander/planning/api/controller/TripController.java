package com.wander.planning.api.controller;

import com.wander.planning.api.constant.PlanningApiConstants;
import com.wander.planning.api.request.CreateTripRequest;
import com.wander.planning.api.request.DoneRequest;
import com.wander.planning.api.request.ItemRequest;
import com.wander.planning.api.request.ReorderRequest;
import com.wander.planning.api.request.ScheduleRequest;
import com.wander.planning.api.request.UpdateTripRequest;
import com.wander.planning.api.response.PlanningResponses;
import com.wander.planning.application.command.PlanningCommandHandler;
import com.wander.planning.application.command.PlanningCommands;
import com.wander.planning.application.query.PlanningQueries;
import com.wander.planning.application.view.PlanningViews;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.security.AuthenticatedPrincipal;
import com.wander.shared.kernel.util.Ids;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * The Planning API. The CQRS pattern at controller level: write commands go through {@link PlanningCommandHandler} (return an id),
 * then the read model is read back through {@link PlanningQueries}. Someone else's trip => 404 as if it did not exist (INV-6).
 */
@RestController
@RequestMapping(PlanningApiConstants.TRIPS_PATH)
public class TripController {

    private final PlanningCommandHandler commands;
    private final PlanningQueries queries;

    /** Takes the command handler (writes) and the read side. */
    public TripController(PlanningCommandHandler commands, PlanningQueries queries) {
        this.commands = commands;
        this.queries = queries;
    }

    /** The owner's list of trips. */
    @GetMapping
    public PlanningResponses.TripsResponse listTrips(AuthenticatedPrincipal principal) {
        return new PlanningResponses.TripsResponse(queries.listTrips(principal.identityId()));
    }

    /** Soft-deleted trips ('Recently deleted trips'), the most recently deleted first. */
    @GetMapping(PlanningApiConstants.DELETED_TRIPS_PATH)
    public PlanningResponses.DeletedTripsResponse deletedTrips(AuthenticatedPrincipal principal) {
        return new PlanningResponses.DeletedTripsResponse(queries.deletedTrips(principal.identityId()));
    }

    /** Soft-delete a whole trip. */
    @DeleteMapping(PlanningApiConstants.TRIP_PATH)
    public ResponseEntity<Void> deleteTrip(AuthenticatedPrincipal principal, @PathVariable String tripId) {
        commands.deleteTrip(new PlanningCommands.DeleteTrip(principal.identityId(), parseId(tripId)));
        return ResponseEntity.noContent().build();
    }

    /** Restore a soft-deleted trip. */
    @PostMapping(PlanningApiConstants.TRIP_RESTORE_PATH)
    public PlanningResponses.TripResponse restoreTrip(AuthenticatedPrincipal principal, @PathVariable String tripId) {
        UUID trip = parseId(tripId);
        commands.restoreTrip(new PlanningCommands.RestoreTrip(principal.identityId(), trip));
        return tripResponse(principal, trip);
    }

    /** Create a new trip. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PlanningResponses.TripResponse createTrip(AuthenticatedPrincipal principal, @RequestBody CreateTripRequest body) {
        UUID tripId = commands.createTrip(body.toCommand(principal.identityId()));
        return tripResponse(principal, tripId);
    }

    /** Trip detail: the schedule by day, the totals, the budget, the unfinished to-dos. */
    @GetMapping(PlanningApiConstants.TRIP_PATH)
    public PlanningViews.TripDetail getTripDetail(AuthenticatedPrincipal principal, @PathVariable String tripId) {
        return queries.detail(principal.identityId(), parseId(tripId));
    }

    /** Edit a trip (a field that is not given stays unchanged). */
    @PatchMapping(PlanningApiConstants.TRIP_PATH)
    public PlanningResponses.TripResponse updateTrip(AuthenticatedPrincipal principal, @PathVariable String tripId, @RequestBody UpdateTripRequest body) {
        UUID trip = parseId(tripId);
        commands.updateTrip(body.toCommand(principal.identityId(), trip));
        return tripResponse(principal, trip);
    }

    /** Add an item to a day of the trip. */
    @PostMapping(PlanningApiConstants.ITEMS_PATH)
    @ResponseStatus(HttpStatus.CREATED)
    public PlanningResponses.ItemResponse addItem(AuthenticatedPrincipal principal, @PathVariable String tripId, @RequestBody ItemRequest body) {
        UUID trip = parseId(tripId);
        UUID item = commands.addItem(new PlanningCommands.AddItem(principal.identityId(), trip, body.toFields()));
        return itemResponse(principal, trip, item);
    }

    /** One item of the trip. */
    @GetMapping(PlanningApiConstants.ITEM_PATH)
    public PlanningResponses.ItemResponse getItem(AuthenticatedPrincipal principal, @PathVariable String tripId, @PathVariable String itemId) {
        return itemResponse(principal, parseId(tripId), parseId(itemId));
    }

    /** Edit an item (a field that is not given stays unchanged). */
    @PatchMapping(PlanningApiConstants.ITEM_PATH)
    public PlanningResponses.ItemResponse editItem(AuthenticatedPrincipal principal, @PathVariable String tripId, @PathVariable String itemId,
                                        @RequestBody ItemRequest body) {
        UUID trip = parseId(tripId);
        UUID item = parseId(itemId);
        commands.editItem(new PlanningCommands.EditItem(principal.identityId(), trip, item, body.toFields()));
        return itemResponse(principal, trip, item);
    }

    /** Soft-delete an item (into 'Recently deleted'). */
    @DeleteMapping(PlanningApiConstants.ITEM_PATH)
    public PlanningResponses.ItemResponse softDeleteItem(AuthenticatedPrincipal principal, @PathVariable String tripId, @PathVariable String itemId) {
        UUID trip = parseId(tripId);
        UUID item = parseId(itemId);
        commands.softDeleteItem(new PlanningCommands.SoftDeleteItem(principal.identityId(), trip, item));
        return itemResponse(principal, trip, item);
    }

    /** Restore a soft-deleted item. */
    @PostMapping(PlanningApiConstants.ITEM_RESTORE_PATH)
    public PlanningResponses.ItemResponse restoreItem(AuthenticatedPrincipal principal, @PathVariable String tripId, @PathVariable String itemId) {
        UUID trip = parseId(tripId);
        UUID item = parseId(itemId);
        commands.restoreItem(new PlanningCommands.RestoreItem(principal.identityId(), trip, item));
        return itemResponse(principal, trip, item);
    }

    /** Permanently delete an item that is already in 'Recently deleted'. */
    @DeleteMapping(PlanningApiConstants.ITEM_PERMANENT_PATH)
    public ResponseEntity<Void> purgeItem(AuthenticatedPrincipal principal, @PathVariable String tripId, @PathVariable String itemId) {
        commands.purgeItem(new PlanningCommands.PurgeItem(principal.identityId(), parseId(tripId), parseId(itemId)));
        return ResponseEntity.noContent().build();
    }

    /** Tick/untick a to-do or 'Visited' for the caller; keeps the existing completion contract. */
    @PutMapping(PlanningApiConstants.ITEM_DONE_PATH)
    public PlanningResponses.ItemResponse setTaskDone(AuthenticatedPrincipal principal, @PathVariable String tripId, @PathVariable String itemId,
                                           @RequestBody DoneRequest body) {
        UUID trip = parseId(tripId);
        UUID item = parseId(itemId);
        commands.setTaskDone(new PlanningCommands.SetTaskDone(principal.identityId(), trip, item, body.done()));
        return itemResponse(principal, trip, item);
    }

    /** Reorder the items currently shown in a day; returns the items of that day in the new order. */
    @PostMapping(PlanningApiConstants.DAY_REORDER_PATH)
    public PlanningResponses.ItemsResponse reorderDay(AuthenticatedPrincipal principal, @PathVariable String tripId, @PathVariable String day,
                                          @RequestBody ReorderRequest body) {
        UUID trip = parseId(tripId);
        LocalDate reorderedDay = commands.reorderDay(
                new PlanningCommands.ReorderDay(principal.identityId(), trip, day, body.orderedIds()));
        return new PlanningResponses.ItemsResponse(queries.dayItems(principal.identityId(), trip, reorderedDay));
    }

    /**
     * Atomic schedule command: optionally change the date range and assign dates in bulk to the items in one transaction; returns the trip detail
     * after applying. Sending the old state back is how Undo works.
     */
    @PostMapping(PlanningApiConstants.SCHEDULE_PATH)
    public PlanningViews.TripDetail applySchedule(AuthenticatedPrincipal principal, @PathVariable String tripId, @RequestBody ScheduleRequest body) {
        UUID trip = parseId(tripId);
        commands.applySchedule(body.toCommand(principal.identityId(), trip));
        return queries.detail(principal.identityId(), trip);
    }

    /** The items in 'Recently deleted'. */
    @GetMapping(PlanningApiConstants.TRASH_PATH)
    public PlanningResponses.ItemsResponse getTrash(AuthenticatedPrincipal principal, @PathVariable String tripId) {
        return new PlanningResponses.ItemsResponse(queries.trash(principal.identityId(), parseId(tripId)));
    }

    /** A response that holds one trip, read back after the write. */
    private PlanningResponses.TripResponse tripResponse(AuthenticatedPrincipal principal, UUID tripId) {
        return new PlanningResponses.TripResponse(queries.trip(principal.identityId(), tripId));
    }

    /** A response that holds one item, read back after the write. */
    private PlanningResponses.ItemResponse itemResponse(AuthenticatedPrincipal principal, UUID tripId, UUID itemId) {
        return new PlanningResponses.ItemResponse(queries.item(principal.identityId(), tripId, itemId));
    }

    /** The id in the URL; a string that is not a UUID counts as non-existent (404). */
    private static UUID parseId(String raw) {
        return Ids.parse(raw).orElseThrow(WanderException::notFound);
    }
}
