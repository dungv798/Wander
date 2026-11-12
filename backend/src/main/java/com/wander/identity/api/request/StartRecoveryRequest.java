package com.wander.identity.api.request;

import com.wander.identity.domain.constant.IdentityErrorCodes;
import com.wander.identity.domain.constant.IdentityMessages;
import com.wander.shared.web.request.InputError;

/**
 * Body of {@code POST /api/recovery/start} (steps 1-2 of recovery with a code). A value of the wrong type is reported exactly like a
 * wrong value, so the answer never tells which part was wrong.
 *
 * @param attemptId    client-generated id of this recovery attempt
 * @param sessionToken the session secret the new device generated for itself
 * @param deviceName   optional self-declared device label
 * @param code         the recovery code
 */
public record StartRecoveryRequest(
        @InputError(code = IdentityErrorCodes.INVALID_ATTEMPT, message = IdentityMessages.INVALID_ATTEMPT) String attemptId,
        @InputError(code = IdentityErrorCodes.INVALID_SESSION_TOKEN, message = IdentityMessages.INVALID_SESSION_TOKEN) String sessionToken,
        String deviceName,
        @InputError(code = IdentityErrorCodes.INVALID_CODE, message = IdentityMessages.INVALID_CODE) String code) {
}
