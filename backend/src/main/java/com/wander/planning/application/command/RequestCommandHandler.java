package com.wander.planning.application.command;

import com.wander.planning.domain.constant.PlanningFields;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.planning.domain.model.DeletionRequest;
import com.wander.planning.domain.model.Item;
import com.wander.planning.domain.model.Trip;
import com.wander.planning.domain.port.TripRepository;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.util.Ids;
import com.wander.shared.kernel.util.Timestamps;
import java.time.Clock;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Handles the deletion-request commands. One transaction per method; on approval the item is soft-deleted in the SAME transaction (same aggregate). */
@Service
@Transactional
public class RequestCommandHandler {

    private final TripRepository trips;
    private final Clock clock;

    /** Takes the trip storage port and the clock. */
    public RequestCommandHandler(TripRepository trips, Clock clock) {
        this.trips = trips;
        this.clock = clock;
    }

    /** A member asks to delete an item that belongs to someone else; returns the request. */
    public DeletionRequest submit(RequestCommands.Submit command) {
        Trip trip = load(command.actor(), command.tripId());
        UUID itemId = Ids.parse(command.itemId() == null ? "" : command.itemId())
                .orElseThrow(() -> WanderException.invalid(ErrorCodes.REQUIRED, PlanningMessages.ITEM_REQUIRED, PlanningFields.REQUEST_ITEM_ID));
        Item item = trip.item(itemId);
        DeletionRequest request = trip.circle().submitDeletion(command.actor(), item, command.reason(), Timestamps.now(clock));
        trips.save(trip);
        return request;
    }

    /** The requester cancels a pending request. */
    public void cancel(RequestCommands.Cancel command) {
        Trip trip = load(command.actor(), command.tripId());
        trip.circle().cancelDeletion(command.actor(), command.requestId());
        trips.save(trip);
    }

    /** The Organizer approves (soft-deletes the item if it is still visible) or rejects; returns the decided request. */
    public DeletionRequest decide(RequestCommands.Decide command) {
        Trip trip = load(command.actor(), command.tripId());
        var now = Timestamps.now(clock);
        DeletionRequest decided = trip.circle().decideDeletion(command.actor(), command.requestId(), command.approve(), now);
        if (command.approve() && !trip.item(decided.itemId()).isDeleted()) trip.softDelete(decided.itemId(), now);
        trips.save(trip);
        return decided;
    }

    /** Loads a trip of which the caller is a member; an outsider => 404. */
    private Trip load(UUID actor, UUID tripId) {
        return trips.findAccessible(tripId, actor).orElseThrow(WanderException::notFound);
    }
}
