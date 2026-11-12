package com.wander.planning.api.request;

import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.web.request.InputError;
import java.util.List;

/**
 * Body of {@code POST /api/trips/{id}/days/{day}/reorder}.
 *
 * @param orderedIds the visible item ids of the day in the new order; it must contain exactly the items of that day
 */
public record ReorderRequest(
        @InputError(code = ErrorCodes.MALFORMED, message = PlanningMessages.ORDER_MALFORMED) List<String> orderedIds) {
}
