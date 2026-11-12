package com.wander.planning.api.request;

import com.wander.planning.application.command.PlanningCommands;
import com.wander.planning.domain.constant.PlanningErrorCodes;
import com.wander.planning.domain.constant.PlanningFields;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.util.FlexibleNumber;
import com.wander.shared.web.request.InputError;
import java.util.List;
import java.util.UUID;

/**
 * Body of {@code POST /api/trips}. Name, destination and both dates are required (checked by the command handler, in the order the
 * API contract documents); every other member is optional.
 *
 * @param name           trip name
 * @param destination    destination id from the catalog
 * @param startDate      first day, {@code YYYY-MM-DD}
 * @param endDate        last day, {@code YYYY-MM-DD}
 * @param budget         planned budget in thousand VND (a number or a string of digits); empty means not set
 * @param styles         trip style codes
 * @param pace           pace code
 * @param datesTentative whether the dates are still uncertain
 * @param kind           who is going (code)
 * @param interests      interest codes
 */
public record CreateTripRequest(
        @InputError(code = ErrorCodes.REQUIRED, message = PlanningMessages.FIELD_REQUIRED) String name,
        @InputError(code = ErrorCodes.REQUIRED, message = PlanningMessages.FIELD_REQUIRED) String destination,
        @InputError(code = PlanningErrorCodes.INVALID_DATE, message = PlanningMessages.TRIP_RANGE_INVALID, field = PlanningFields.END_DATE) String startDate,
        @InputError(code = PlanningErrorCodes.INVALID_DATE, message = PlanningMessages.TRIP_RANGE_INVALID, field = PlanningFields.END_DATE) String endDate,
        FlexibleNumber budget,
        @InputError(code = PlanningErrorCodes.INVALID_STYLE, message = PlanningMessages.STYLE_INVALID) List<String> styles,
        @InputError(code = PlanningErrorCodes.INVALID_PACE, message = PlanningMessages.PACE_INVALID) String pace,
        Boolean datesTentative,
        @InputError(code = PlanningErrorCodes.INVALID_KIND, message = PlanningMessages.KIND_INVALID) String kind,
        @InputError(code = PlanningErrorCodes.INVALID_INTEREST, message = PlanningMessages.INTEREST_INVALID) List<String> interests) {

    /** The command for the calling identity. */
    public PlanningCommands.CreateTrip toCommand(UUID ownerId) {
        return new PlanningCommands.CreateTrip(ownerId, name, destination, startDate, endDate, budget, styles, pace, datesTentative, kind, interests);
    }
}
