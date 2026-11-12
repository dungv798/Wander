package com.wander.identity.api.request;

import com.wander.identity.domain.constant.IdentityErrorCodes;
import com.wander.identity.domain.constant.IdentityMessages;
import com.wander.shared.web.request.InputError;

/**
 * Body of {@code POST /api/step-up-requests}: ask another trusted device to approve a sensitive operation.
 *
 * @param operation the operation to approve (one of the documented codes)
 */
public record RequestStepUpRequest(
        @InputError(code = IdentityErrorCodes.INVALID_OPERATION, message = IdentityMessages.INVALID_OPERATION) String operation) {
}
