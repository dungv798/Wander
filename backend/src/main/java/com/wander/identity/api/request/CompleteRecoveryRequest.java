package com.wander.identity.api.request;

import com.wander.identity.domain.constant.IdentityErrorCodes;
import com.wander.identity.domain.constant.IdentityMessages;
import com.wander.shared.web.request.InputError;

/**
 * Body of {@code POST /api/recovery/complete} (steps 3-4): the owner re-types the replacement code that was shown in step 2.
 *
 * @param attemptId       the attempt started in step 1
 * @param replacementCode the replacement recovery code
 */
public record CompleteRecoveryRequest(
        @InputError(code = IdentityErrorCodes.INVALID_ATTEMPT, message = IdentityMessages.INVALID_ATTEMPT) String attemptId,
        @InputError(code = IdentityErrorCodes.INVALID_REPLACEMENT, message = IdentityMessages.INVALID_REPLACEMENT) String replacementCode) {
}
