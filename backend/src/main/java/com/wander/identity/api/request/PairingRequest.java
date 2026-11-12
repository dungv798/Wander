package com.wander.identity.api.request;

import com.wander.identity.domain.constant.IdentityErrorCodes;
import com.wander.identity.domain.constant.IdentityMessages;
import com.wander.shared.web.request.InputError;

/**
 * Body of the device-pairing preview, deny and approve endpoints.
 *
 * @param pairingCode the short code shown on the new device
 * @param number      the match number the approver picked (approve only; required there, a two-digit integer)
 */
public record PairingRequest(
        @InputError(code = IdentityErrorCodes.INVALID_PAIRING_CODE, message = IdentityMessages.INVALID_PAIRING_CODE) String pairingCode,
        Integer number) {
}
