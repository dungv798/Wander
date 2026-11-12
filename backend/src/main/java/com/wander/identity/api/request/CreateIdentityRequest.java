package com.wander.identity.api.request;

/**
 * Body of {@code POST /api/identity}: creates an anonymous identity with its first session.
 *
 * @param skipRecoveryCode true to skip being shown a recovery code now (allowed with a warning in the UI); absent means false
 * @param deviceName       optional self-declared device label (unverified, normalized, length-limited)
 */
public record CreateIdentityRequest(
        Boolean skipRecoveryCode,
        String deviceName) {
}
