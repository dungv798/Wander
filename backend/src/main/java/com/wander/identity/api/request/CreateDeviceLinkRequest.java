package com.wander.identity.api.request;

import com.wander.identity.domain.constant.IdentityErrorCodes;
import com.wander.identity.domain.constant.IdentityMessages;
import com.wander.shared.web.request.InputError;

/**
 * Body of {@code POST /api/device-links}: a new device asks to be paired with an already trusted one.
 *
 * @param sessionToken the session secret the new device generated for itself
 * @param deviceName   optional self-declared device label
 */
public record CreateDeviceLinkRequest(
        @InputError(code = IdentityErrorCodes.INVALID_SESSION_TOKEN, message = IdentityMessages.INVALID_SESSION_TOKEN) String sessionToken,
        String deviceName) {
}
