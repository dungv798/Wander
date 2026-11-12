package com.wander.planning.api.request;

import com.wander.planning.application.command.MembershipCommands;
import java.util.UUID;

/**
 * Body of {@code PATCH /api/trips/{id}/members/me}.
 *
 * @param displayName the new display name
 */
public record RenameSelfRequest(String displayName) {

    /** The command for the calling identity and trip. */
    public MembershipCommands.RenameSelf toCommand(UUID actor, UUID tripId) {
        return new MembershipCommands.RenameSelf(actor, tripId, displayName);
    }
}
