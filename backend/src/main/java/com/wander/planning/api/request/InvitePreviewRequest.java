package com.wander.planning.api.request;

import com.wander.planning.domain.constant.PlanningErrorCodes;
import com.wander.planning.domain.constant.PlanningMessages;
import com.wander.shared.web.request.InputError;

/**
 * Body of {@code POST /api/invites/preview}: look at an invite link before joining.
 *
 * @param code the invite code from the link; every unusable code gets the same {@code INVALID_INVITE} answer
 */
public record InvitePreviewRequest(
        @InputError(code = PlanningErrorCodes.INVALID_INVITE, message = PlanningMessages.INVALID_INVITE) String code) {
}
