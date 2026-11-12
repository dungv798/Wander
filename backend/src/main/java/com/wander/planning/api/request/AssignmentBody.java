package com.wander.planning.api.request;

import com.wander.planning.application.input.AssignmentInput;
import com.wander.planning.domain.constant.PlanningErrorCodes;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.shared.kernel.util.FlexibleNumber;
import com.wander.shared.web.request.InputError;

/**
 * One entry of a bulk day assignment.
 *
 * @param itemId   id of an item of the trip (an unknown or malformed id is a 404)
 * @param day      target day {@code YYYY-MM-DD}, or null/omitted for "no day"
 * @param position requested position within the day (ignored when not a number)
 */
public record AssignmentBody(
        String itemId,
        @InputError(code = PlanningErrorCodes.INVALID_DATE, message = PlanningMessages.DAY_INVALID) String day,
        FlexibleNumber position) {

    /** The application-level value. */
    public AssignmentInput toInput() {
        return new AssignmentInput(itemId, day, position);
    }
}
