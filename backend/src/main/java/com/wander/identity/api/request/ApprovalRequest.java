package com.wander.identity.api.request;

import com.wander.identity.domain.constant.IdentityErrorCodes;
import com.wander.identity.domain.constant.IdentityMessages;
import com.wander.shared.web.request.InputError;

/**
 * Body of the step-up preview, deny and approve endpoints.
 *
 * @param approvalCode the short code shown on the requesting device
 * @param number       the match number the approver picked (approve only; required there, a two-digit integer)
 */
public record ApprovalRequest(
        @InputError(code = IdentityErrorCodes.INVALID_APPROVAL_CODE, message = IdentityMessages.INVALID_APPROVAL_CODE) String approvalCode,
        Integer number) {
}
