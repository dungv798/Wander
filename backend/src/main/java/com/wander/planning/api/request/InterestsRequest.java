package com.wander.planning.api.request;

import com.wander.planning.application.command.PlanningCommands;
import com.wander.planning.domain.constant.PlanningErrorCodes;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.shared.kernel.util.Patch;
import com.wander.shared.web.request.InputError;
import java.util.List;
import java.util.UUID;

/**
 * Body of {@code PUT /api/preferences/interests}: replaces the interests of the identity.
 *
 * @param interests interest codes; the member must be sent (omitted is {@code REQUIRED}); null or an empty list clears the interests
 */
public record InterestsRequest(
        @InputError(code = PlanningErrorCodes.INVALID_INTEREST, message = PlanningMessages.INTEREST_INVALID) Patch<List<String>> interests) {

    /** The command for the calling identity. */
    public PlanningCommands.SetInterestPreferences toCommand(UUID ownerId) {
        return new PlanningCommands.SetInterestPreferences(ownerId, interests);
    }
}
