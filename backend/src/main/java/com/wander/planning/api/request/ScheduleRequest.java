package com.wander.planning.api.request;

import com.wander.planning.application.command.PlanningCommands;
import com.wander.planning.application.input.AssignmentInput;
import com.wander.planning.domain.constant.PlanningErrorCodes;
import com.wander.planning.domain.constant.PlanningFields;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.util.Patch;
import com.wander.shared.web.request.InputError;
import java.util.List;
import java.util.UUID;

/**
 * Body of {@code POST /api/trips/{id}/schedule}: optionally change the date range and assign items to days, atomically. At least one of
 * the date members or {@code assignments} must be sent. Sending back the old state is how Undo works.
 *
 * @param startDate   new first day (omit to keep it)
 * @param endDate     new last day (omit to keep it)
 * @param assignments item-to-day assignments, at most the documented maximum
 */
public record ScheduleRequest(
        @InputError(code = PlanningErrorCodes.INVALID_DATE, message = PlanningMessages.TRIP_RANGE_INVALID, field = PlanningFields.END_DATE) Patch<String> startDate,
        @InputError(code = PlanningErrorCodes.INVALID_DATE, message = PlanningMessages.TRIP_RANGE_INVALID, field = PlanningFields.END_DATE) Patch<String> endDate,
        @InputError(code = ErrorCodes.MALFORMED, message = PlanningMessages.ASSIGNMENTS_MALFORMED) Patch<List<AssignmentBody>> assignments) {

    /** The command for the calling identity and trip. */
    public PlanningCommands.ApplySchedule toCommand(UUID ownerId, UUID tripId) {
        Patch<List<AssignmentInput>> inputs = assignments.map(list -> list == null ? null : list.stream().map(body -> body == null ? null : body.toInput()).toList());
        return new PlanningCommands.ApplySchedule(ownerId, tripId, startDate, endDate, inputs);
    }
}
