package com.wander.planning.api.request;

import com.wander.planning.application.command.RequestCommands;
import java.util.UUID;

/**
 * Body of {@code POST /api/trips/{id}/deletion-requests}: ask the organizer to delete an item added by someone else.
 *
 * @param itemId id of the item (missing or malformed is {@code REQUIRED})
 * @param reason optional reason shown to the organizer
 */
public record SubmitDeletionRequest(String itemId, String reason) {

    /** The command for the calling identity and trip. */
    public RequestCommands.Submit toCommand(UUID actor, UUID tripId) {
        return new RequestCommands.Submit(actor, tripId, itemId, reason);
    }
}
