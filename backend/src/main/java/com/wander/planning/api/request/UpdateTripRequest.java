package com.wander.planning.api.request;

import com.wander.planning.application.command.PlanningCommands;
import com.wander.planning.domain.constant.PlanningErrorCodes;
import com.wander.planning.domain.constant.PlanningFields;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.util.FlexibleNumber;
import com.wander.shared.kernel.util.Patch;
import com.wander.shared.web.request.InputError;
import java.util.List;
import java.util.UUID;

/**
 * Body of {@code PATCH /api/trips/{id}}. Every member is a {@link Patch}: omitted means "leave as it is"; sent as null (or an empty
 * string where documented) clears an optional value; sent with a value replaces it. All members are optional.
 *
 * @param name           new name
 * @param destination    new destination id
 * @param startDate      new first day; if only one end is sent the other keeps its current value
 * @param endDate        new last day
 * @param budget         planned budget in thousand VND, or null to clear
 * @param styles         trip style codes
 * @param pace           pace code, or null to clear
 * @param datesTentative whether the dates are uncertain
 * @param kind           who is going, or null to clear
 * @param interests      interest codes
 * @param cover          the cover, or null for the automatic cover
 */
public record UpdateTripRequest(
        @InputError(code = ErrorCodes.REQUIRED, message = PlanningMessages.FIELD_REQUIRED) Patch<String> name,
        @InputError(code = ErrorCodes.REQUIRED, message = PlanningMessages.FIELD_REQUIRED) Patch<String> destination,
        @InputError(code = PlanningErrorCodes.INVALID_DATE, message = PlanningMessages.TRIP_RANGE_INVALID, field = PlanningFields.END_DATE) Patch<String> startDate,
        @InputError(code = PlanningErrorCodes.INVALID_DATE, message = PlanningMessages.TRIP_RANGE_INVALID, field = PlanningFields.END_DATE) Patch<String> endDate,
        Patch<FlexibleNumber> budget,
        @InputError(code = PlanningErrorCodes.INVALID_STYLE, message = PlanningMessages.STYLE_INVALID) Patch<List<String>> styles,
        @InputError(code = PlanningErrorCodes.INVALID_PACE, message = PlanningMessages.PACE_INVALID) Patch<String> pace,
        Patch<Boolean> datesTentative,
        @InputError(code = PlanningErrorCodes.INVALID_KIND, message = PlanningMessages.KIND_INVALID) Patch<String> kind,
        @InputError(code = PlanningErrorCodes.INVALID_INTEREST, message = PlanningMessages.INTEREST_INVALID) Patch<List<String>> interests,
        @InputError(code = PlanningErrorCodes.INVALID_COVER, message = PlanningMessages.INVALID_COVER) Patch<CoverBody> cover) {

    /** The command for the calling identity and trip. */
    public PlanningCommands.UpdateTrip toCommand(UUID ownerId, UUID tripId) {
        return new PlanningCommands.UpdateTrip(ownerId, tripId, name, destination, startDate, endDate, budget, styles, pace, datesTentative,
                kind, interests, cover.map(body -> body == null ? null : body.toInput()));
    }
}
