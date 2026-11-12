package com.wander.planning.api.request;

import com.wander.planning.application.input.CoverInput;
import com.wander.planning.domain.constant.PlanningErrorCodes;
import com.wander.planning.domain.constant.PlanningFields;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.shared.web.request.InputError;

/**
 * A trip cover as sent in a request. A value of the wrong type in either member is reported as {@code INVALID_COVER} on the field
 * {@code cover}, like every other cover problem.
 *
 * @param kind {@code photo} or {@code gradient}
 * @param ref  photo id or gradient name
 */
public record CoverBody(
        @InputError(code = PlanningErrorCodes.INVALID_COVER, message = PlanningMessages.INVALID_COVER, field = PlanningFields.COVER) String kind,
        @InputError(code = PlanningErrorCodes.INVALID_COVER, message = PlanningMessages.INVALID_COVER, field = PlanningFields.COVER) String ref) {

    /** The application-level value. */
    public CoverInput toInput() {
        return new CoverInput(kind, ref);
    }
}
