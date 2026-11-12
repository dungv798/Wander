package com.wander.identity.application.input;

/**
 * Proof of re-authentication sent when asking for a new recovery code: either the current recovery code, or an approval from
 * another trusted device.
 *
 * @param type      {@code code} or {@code approval}
 * @param code      the current recovery code (for {@code code})
 * @param requestId id of the approved step-up request (for {@code approval})
 */
public record EvidenceInput(String type, String code, String requestId) {
}
