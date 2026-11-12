package com.wander.planning.api.request;

import com.wander.planning.application.command.MembershipCommands;
import com.wander.planning.domain.constant.PlanningErrorCodes;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.shared.web.request.InputError;
import java.util.UUID;

/**
 * Body of {@code POST /api/invites/join}. Every unusable code, including one of the wrong JSON type, gets the same
 * {@code INVALID_INVITE} answer, so the response never tells which invite codes exist.
 *
 * @param code        the invite code from the link
 * @param displayName the name to show to the other members
 */
public record JoinRequest(
        @InputError(code = PlanningErrorCodes.INVALID_INVITE, message = PlanningMessages.INVALID_INVITE) String code,
        String displayName) {

    /** The command for the calling identity. */
    public MembershipCommands.Join toCommand(UUID actor) {
        return new MembershipCommands.Join(actor, code, displayName);
    }
}
