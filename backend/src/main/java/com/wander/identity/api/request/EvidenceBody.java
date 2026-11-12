package com.wander.identity.api.request;

import com.wander.identity.application.input.EvidenceInput;

/**
 * Proof of re-authentication: the current recovery code, or an approval granted by another trusted device.
 *
 * @param type      {@code code} or {@code approval}
 * @param code      the current recovery code (type {@code code})
 * @param requestId id of the approved step-up request (type {@code approval})
 */
public record EvidenceBody(
        String type,
        String code,
        String requestId) {

    /** The application-level value. */
    public EvidenceInput toInput() {
        return new EvidenceInput(type, code, requestId);
    }
}
