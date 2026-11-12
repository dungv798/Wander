package com.wander.identity.api.request;

import com.wander.identity.domain.constant.IdentityErrorCodes;
import com.wander.identity.domain.constant.IdentityMessages;
import com.wander.shared.web.request.InputError;

/**
 * Body of {@code POST /api/recovery-code/confirm} (phase 2): the owner re-types the new code.
 *
 * @param pendingId       id returned by phase 1
 * @param replacementCode the new recovery code
 */
public record ConfirmReplacementRequest(
        @InputError(code = IdentityErrorCodes.INVALID_REPLACEMENT, message = IdentityMessages.INVALID_REPLACEMENT) String pendingId,
        @InputError(code = IdentityErrorCodes.INVALID_REPLACEMENT, message = IdentityMessages.INVALID_REPLACEMENT) String replacementCode) {
}
